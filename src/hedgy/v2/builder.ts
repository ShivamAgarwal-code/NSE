/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { z, ZodAny } from "zod";
import { ModelInput, ModelOutput } from "./model"
import zodToJsonSchema from "zod-to-json-schema";
import { Effect, pipe } from "effect";
import { Router } from "./router";


type Tool = {
    name: string,
    description: string,
    args: Record<string, any>
}

type PromptLevel = `${number}`

class Input {
    __tag = "Input" as const;
    instruction: string
    promptLevel: PromptLevel
    examples?: string
    tools?: Array<Tool>

    constructor(
        instruction: string, 
        examples?: string,
        tools?: Array<Tool>,
        promptLevel: PromptLevel | undefined = `1`
    ) {
        this.instruction = instruction
        this.examples = examples
        this.tools = tools
        this.promptLevel = promptLevel
    }

    serialize(input: string){
        const content =  `
            <instructions>
            ${this.instruction}
            </instructions>
            ${this.examples ? `<examples>
            ${this.examples}
            </examples>` : ""}
            <input>
            ${
                typeof input == "object" ? JSON.stringify(input) : input
            }
            <input>
        `

        const model_input: ModelInput = {
            question: content,
            tools: this.tools
        }

        return model_input
    }
}

const reasonSchema = z.object({
    reason: z.string()
})
class Evaluator {
    __tag = "Evaluator" as const
    promptLevel?: `${number}`
    validationRequirement: string
    examples?: string

    constructor (validationRequirement: string, examples?: string, promptLevel: `${number}` | undefined = `1`) {
        this.validationRequirement = validationRequirement
        this.examples = examples
        this.promptLevel = promptLevel
    }

    serialize(input: string) {
        const content = `
            <instructions>
            ${this.validationRequirement}
            </instructions>
            ${this.examples ? `<examples>
                ${this.examples}
                </examples>` : ""}
            <input>
            ${
                typeof input == "object" ? JSON.stringify(input) : input
            }
            </input>
        `

        const model_input: ModelInput = {
            question: content,
            tools: [
                {
                    name: "isCorrect",
                    description: "Marks the input as correct and provides a reason for correctness",
                    args: zodToJsonSchema(reasonSchema)
                },
                {
                    name: "isWrong",
                    description: "Marks the input as wrong and provides a reason for wrongness",
                    args: zodToJsonSchema(reasonSchema)
                },
                // { // TODO: I guess we could just have a prompt to request this from the user before any serious processing begins
                //     name: "isQuestion",
                //     description: "Marks the input as a question that needs to be answered by the user, and provides a reason why",
                //     args: zodToJsonSchema(reasonSchema)
                // }
            ],
        }

        return model_input
    }
}


class Parser {
    __tag = "Parser" as const
    handler: (input: any, artifacts: Array<Artifact>) => Effect.Effect<any, any>

    constructor(handler: (input: any, artifacts: Array<Artifact>) => Effect.Effect<any, any>) {
        this.handler = handler
    }

    run(input: any, artifacts: Array<Artifact> | undefined = []) {
        return this.handler(input, artifacts)
    }
}

type ExecutorType = "evaluator" | "parser" | "user" | "prompt"
export class Artifact {
    executor: ExecutorType
    output?: ModelOutput
    input?: ModelInput | string
    data?: any
    step?: number

    constructor(executor: ExecutorType, output?: ModelOutput, data?: any, step?: number, input?: ModelInput | string) {
        this.executor = executor
        this.output = output
        this.data = data
        this.step = step
        this.input = input
    }

    static define(args: {
        executor: ExecutorType, output?: ModelOutput, data?: any, step?: number, input?: ModelInput | string
    }) {
        return new Artifact(args.executor, args.output, args.data, args.step)
    }
}


export class PromptBuilder<TOutput = any>{
    private router: Router
    private executionStack: Array<Parser | Input | Evaluator> = []
    private maxRetries: number = 3
    private promptArtifacts: Array<Artifact> = [];
    private useHistory: boolean = false
    private onArtifact: ((artifact: Artifact) => void) | undefined = undefined
    constructor(
        router: Router,
        maxRetries: number | undefined = 3,
        useHistory: boolean | undefined = false,
    ) {
        this.router = router 
        this.maxRetries = maxRetries
        this.useHistory = useHistory
    }

    onStepComplete(onArtifact: (artifact: Artifact) => void) {
        this.onArtifact = onArtifact
    }

    addArtifacts(artifacts: Array<Artifact>) {

        this.promptArtifacts = [...this.promptArtifacts, ...artifacts]
        if (this.onArtifact) {
            for (const artifact of artifacts) {
                this.onArtifact(artifact)
            }
        }
        return this
    }

    addArtifact(artifact: Artifact) {
        this.promptArtifacts.push(artifact)
        if (this.onArtifact) {
            this.onArtifact(artifact)
        }
        return this
    }

    get artifacts() {
        return this.promptArtifacts
    }

    input(args: {
        instruction: string, 
        examples?: string,
        tools?: Array<Tool>,
        promptLevel?: PromptLevel
    }){
        this.executionStack.push(
            new Input(args.instruction, args.examples, args.tools, args.promptLevel)
        )
        return this
    }

    evaluate(args: {
        validationRequirement: string, 
        examples?: string, 
        promptLevel: PromptLevel | undefined 
    }){
        this.executionStack.push(
            new Evaluator(args.validationRequirement, args.examples, args.promptLevel)
        )
        return this
    }

    parse<Input = any, Output = any>(handler: (input: Input)=>Effect.Effect<Output, any>) {
        this.executionStack.push(
            new Parser(handler) 
        )
        return this
    }

    private getNextEffect(router: Router, input: any, executor: Input | Parser | Evaluator, builder: PromptBuilder, step?: number) {
        if(!executor) return Effect.try(()=>null);


        const addNewArtifact = (artifact: Artifact) => {
            builder.addArtifact(artifact)
        }

        const chatHistory = builder.useHistory == false ? [] : builder.promptArtifacts
            ?.filter((artifact) => artifact.executor == "prompt" && artifact.output)
            ?.map((artifact) => artifact.output)
            ?.filter((output) => output !== undefined);

        switch(executor.__tag){
            case "Evaluator": {
                const model = router.route(executor.promptLevel ?? `1`)
                const model_input = executor.serialize(input)
                return model.ask(model_input, chatHistory).pipe(
                    Effect.andThen((modelOutput) => Effect.try(() => {
                        modelOutput.role = "assistant"
                        addNewArtifact(Artifact.define({
                            executor: "evaluator",
                            output: modelOutput,
                            step,
                            input: input
                        }))
                        return modelOutput
                    })),
                    Effect.andThen((modelOutput)=> Effect.try(()=>{
                        return {
                            output: modelOutput,
                            input
                        }
                    }))
                )
            }
            case "Input": {
                const model = router.route(executor.promptLevel)
                const model_input = executor.serialize(input)
                return model
                    .ask(model_input, chatHistory)
                    .pipe(
                        Effect.andThen((modelOutput) => Effect.try(() => {
                            // If there are no previous artifacts, then this is the first message and can be added as the user prompt to the artifact stack
                            addNewArtifact(
                                Artifact.define({
                                    step: step ? step - 1 : undefined,
                                    executor: "prompt",
                                    output: {
                                        answer: model_input.question ?? "",
                                        role: "user",

                                    }
                                })
                            )
                            // -----
                            modelOutput.role = "assistant"
                            addNewArtifact(Artifact.define({
                                executor: "prompt",
                                output: modelOutput,
                                step
                            }))
                            return modelOutput
                        }))
                    )
            }
            case "Parser": {
                return executor.run(input)
                    .pipe(
                        Effect.andThen((result) => Effect.try(() => {
                            addNewArtifact(Artifact.define({
                                step,
                                executor: "parser",
                                data: result
                            }))
                            return result
                        }))
                    )
            } 
            default: {
                return Effect.try(()=>null)
            }
        }
        
    }

    build(_input: string): Effect.Effect<TOutput, any>{
        const router = this.router;
        const initialEffect = Effect.tryPromise<any,any>({
            try: async () => {
                console.log(_input)
                return _input
            },
            catch(error) {
                return error
            },
        })
        
        const stack = this.executionStack;
        const get_next = this.getNextEffect
        const builder = this;
       
        const pipeline = stack.reduce((acc, executor, step) => {
            
            const res =  acc.pipe(
                Effect.andThen((output) => get_next(router, output, executor, builder, step + 1))
            )

            return res
        }, initialEffect)


        return Effect.retry(pipeline, {times: this.maxRetries})
        
    }

    resume(lastStep: number) {
        // assumption is the user preloaded all the artifacts

        if (lastStep < 1 || lastStep >= this.executionStack.length || lastStep > this.promptArtifacts.length) {
            throw new Error("Cannot begin at step less than 1")
        }
        const lastArtifact = this.promptArtifacts.at(lastStep - 1)
        if (!lastArtifact) {
            throw new Error("No Artifact found")
        }
        const remainingSteps = this.executionStack.slice(lastStep - 1)
        if (remainingSteps.length == 0) {
            throw new Error("No steps remaining")
        }

        const get_next = this.getNextEffect
        const builder = this;
        const router = this.router;


        const pipeline = remainingSteps.reduce((acc, executor, step) => {

            const res = acc.pipe(
                Effect.andThen((output) => get_next(router, output, executor, builder, step + 1))
            )

            return res
        }, Effect.try(() => lastArtifact.executor == "parser" ? lastArtifact.data : lastArtifact.output))

        return Effect.retry(pipeline, { times: this.maxRetries })
    }

    dropArtifacts() {
        this.promptArtifacts = []
    }
}
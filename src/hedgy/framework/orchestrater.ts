/* eslint-disable @typescript-eslint/prefer-as-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect, Either } from "effect";
import { Action } from "./action";
import { Library } from "./library";
import { Oracle } from "./oracle";
import { TASK_RESPONSE_FORMATTER_SYSTEM_PROMPT } from "./SYSTEM_PROMPTS";
import { createPrompt, sendToLLM } from "./utils";
import zodToJsonSchema from "zod-to-json-schema";
import { z } from "zod";
import { UIBLOCK } from "../agent/actions";

type onCompletionFn = undefined | (( result: Array<UIBLOCK> | null, error?: any) => void )

export const goalCompleteSchema = zodToJsonSchema(z.object({
    status: z.enum(['completed', "failed", "unable-to-complete"]),
    result: z.any()
}))

export interface ContextItem {
    task: string,
    taskDescription: string,
    taskResult: any,
    stepDescription?: string
}

export interface Goal {
    task: string,
    completionCriteria: string
    directive: string
    data_sources?: string
}

export class Task {
    executor: Action
    input: any
    output: any
    status: "pending" | "completed" | "failed" = "pending"
    reporter: (status: "pending" | "completed" | "failed" | "reformat-failure", executor: Oracle | Action, error?: any) => void

    static __type: "Task" = "Task"

    static async reformat(executor: Action, prevResult: any, context: Array<ContextItem> | undefined = undefined) {
        
        const question = TASK_RESPONSE_FORMATTER_SYSTEM_PROMPT(
            executor,
            prevResult,
            context || []
        )

        const response = await sendToLLM(question)
        const data = JSON.parse(response)

        return data
    }

    constructor(executor: Action, reporter: (status: "pending" | "completed" | "failed" | "reformat-failure", executor: Oracle | Action, error?: any) => void) {
        this.executor = executor
        this.reporter = reporter
    }

    async execute(args: { _prevResult: any | undefined, context: Array<ContextItem>, library: Library, goal: Goal }, onCompletion: onCompletionFn): Promise<any> {
        const { _prevResult, context = [], library, goal } = args 
        let prevResult = _prevResult
        console.log("Prev Result ::", prevResult)
        try {
            if(prevResult){
                prevResult = await Task.reformat(this.executor,prevResult, context)
            }
        }
        catch (e)
        {
            this.reporter("reformat-failure", this.executor, e)
            return
        }

        const reporter = this.reporter
        this.input = prevResult
        const executor = this.executor
        const setOutput = (output: any) => {
            this.output = output
        }


        const either = Effect.either(this.executor.Do(prevResult, goal, context))
        const eitherResult = await Effect.runPromise(either)
        return await Either.match(eitherResult, {
            onLeft(left) {
                reporter("failed", executor, left)
                onCompletion?.(null, left)
            },
            async onRight(right) {
                console.log("Data to right ::", right)
                reporter("completed", executor, null)
                setOutput(right)
                context?.push({
                    task: executor.Name,
                    taskDescription: executor.Description,
                    taskResult: right,
                })
                if(executor.Name === "CHOOSE_UI_BLOCK"){
                    onCompletion?.(right, null)
                    return
                }

                return await Task.next({
                    context: context ?? [],
                    goal,
                    library,
                    reporter
                }, onCompletion)
            },
        })

    }

    static async next(args: {
        context: Array<ContextItem>,
        library: Library,
        goal: Goal,
        reporter: (...args: any) => void
    }, onCompletion: onCompletionFn = undefined) {

        const { context, library, goal, reporter } = args
        const FUNCTION_NAME = "getNext"

        const COMPLETED_STEPS = context.map((step, i) => {
            return `
                BEGIN STEP ${i + 1}.
                ${step.task}.
                ${step.taskDescription}.
                ${typeof step.taskResult === "object" ? JSON.stringify(step.taskResult) : {}}.
                END STEP ${i + 1}.
            `
        }).join("\n")

        const LIBRARY_SUMMARY = library.Actions.map((action) => {
            return `
                ACTION: ${action.Name} - ${action.Description}. \n
                InputSchema: ${JSON.stringify(zodToJsonSchema(action.InputSchema))}. \n
                OutputSchema: ${JSON.stringify(zodToJsonSchema(action.OutputSchema))}. \n
            `
        }).join("\n\n")

        const prompt = createPrompt(
            {
                role: "system",
                name: "getNext",
                content: `
            <system information>
            <directive>
            I AM A HUMAN ASSISTANT, MY PRIME DIRECTIVE IS TO: ${goal.directive}
            </directive>
            <completion-criteria>
            I'LL END EXECUTION ONCE MY COMPLETION CRITERIA OF ${goal.completionCriteria}
            </completion-criteria>
            </system information>

            <how-i-work>
            ALL USER REQUESTS ARE IN THE CONTEXT OF THE HEDGEHOG PROTOCOL, AND SHOULD ONLY BE ANSWERED IN THE CONTECT OF THE HEDGEHOG PROTOCOL.
            IF THE USER INCLUDES A VERB LIKE BUY I NEED TO PROVIDE A UI BLOCK FOR THE USER TO CONFIRM THE ACTION
            Current task: 
            ${goal.task}
            I WANT TO COMPLETE THIS AS LONG AS IT'S ACHIEVABLE BY MY PRIME DIRECTIVE.
            I ALSO HAVE A NUMBER OF DATA SOURCES YOU CAN REFERENCE
            ${goal.data_sources ?? "NO DATA SOURCES REQUIRED FOR THIS TASK"}
            </how-i-work>
            
            <execution-stack>
            EXECUTED_STEPS ${context.length}
            ${context.length == 0 ? "no steps have been completed yet" : "COMPLETED STEPS"}
            ${COMPLETED_STEPS}
            </execution-stack>
            
            <library>
            AVAILABLE ACTIONS TO DO NEXT:
            ${LIBRARY_SUMMARY}
            </library>
            
            <what-to-do>
            Choose one of the above actions for the next step, or if there's no more steps forward choose CHOOSE_UI_BLOCK
            If the task can be completed by the data from the data sources, choose CHOOSE_UI_BLOCK and parse in the relevant result data
            </what-to-do>
            `
            },
            {
                name: FUNCTION_NAME,
                description: "Determine the next action to take",
                parameters: zodToJsonSchema(
                    z.object({
                        action: z.enum(
                            library.Actions.map((a) => a.Name).concat(['CHOOSE_UI_BLOCK']) as [string]
                        ),
                        input: z.string()
                    })
                )
            },
            FUNCTION_NAME
        )


        const result = await sendToLLM(prompt)

        if (result && result?.trim()?.startsWith("{")) {
            console.log("Result::", result)
            const parsed = JSON.parse(result)
            const action = parsed['action']
            const input = parsed['input']

            const newExecutor = library.GetAction(action.trim())

            if (!newExecutor) throw new Error(`Unable to find executor for action: ${action}`);


            const task = new Task(newExecutor, reporter)

            return task.execute({
                _prevResult: input,
                context,
                goal,
                library
            }, onCompletion)

        }
        return null


    }

}


export interface OrchestraterRequest {
    task: string,
    input: any
}

export class  Orchestrater {
    directive: string
    private library: Library
    private data_sources: string | null = null

    constructor(library: Library, directive: string) {
        this.library = library
        this.directive = directive
    }

    private reporter(status: "pending" | "completed" | "failed" | "reformat-failure", executor: Oracle | Action, error?: any){
        console.log(`Task ${status} by ${executor?.Name}`)
        if (error) { 
            console.log(`Error: ${error}`)
        }
    }

    private async execute(goal: Goal, onCompletion: onCompletionFn) {

        const context: Array<ContextItem> = []

        const result = await Task.next({
            context,
            goal,
            library: this.library,
            reporter: this.reporter
        }, onCompletion)

        console.log("Result::", result)
    }


    private async buildContext(goal: Goal) {
        const oracles = await this.library.AskOracle({
            goal
        })

        const contextData = await Promise.all(oracles.map(async (oracle_name) => {
            const oracle = this.library.GetOracle(oracle_name)

            if (!oracle) return null;

            const either = await Effect.runPromise(Effect.either(oracle.Read(goal)))

            const result = Either.match(either, {
                onLeft(left) {
                    console.log("Unable to read from oracle::", left)
                    return null
                },
                onRight(right) {
                    console.log("Oracle data fetched")
                    return right
                }
            })

            if (!result) {
                console.log("No Results found")
                return null;
            }

            return {
                result,
                name: oracle.Name,
                description: oracle.Description
            }


        }))

        const CONTEXT_SUMMARY = contextData.map((context) => {
            if (!context) return "";

            return `
            <source>
            SOURCE ${context.name} 
            SOURCE DESCRIPTION ${context.description}
            RESULTS:
            ${JSON.stringify(context.result)}
            </source>
            `
        })?.join("\n")

        const data_sources = `
        <sources>
        ${CONTEXT_SUMMARY}
        </sources>
        `;

        this.data_sources = data_sources

        return data_sources
    }

    async run(goal: Goal, onCompletion?: onCompletionFn) {
        const data = await this.buildContext(goal)
        await this.execute({
            ...goal,
            data_sources: data,
            directive: this.directive
        }, onCompletion)
    }

}
import { Effect } from "effect";
import entryPrompt from "./entry";
import resourcePrompt from "./resources";
import uiBlockPrompt from "./ui-blocks";
import { ModelOutput } from "../../model";
import { Artifact } from "../../builder";



export async function hedgyAnswer(input: string, history: Array<ModelOutput>){
    entryPrompt.addArtifacts(
        history?.map((output)=>{
            return Artifact.define({
                executor: "prompt",
                output: {
                    answer: output.answer,
                    role: output.role
                }
            })
        })
    )
    let prompt_with_history = ""
    for (const output of history){
        console.log("Added history")
        prompt_with_history += `
        <message>
        [${output.role}] : ${output.answer}
        </message>
        `
    }

    prompt_with_history += `
        <prompt>
        ${input}
        </prompt>
    `
    const entry = entryPrompt.build(prompt_with_history)
    const entryResult = await Effect.runPromise(entry)
    console.log("ENtry result::" , entryResult)
    if(entryResult.name == "answerNow" || entryResult.name == "askBack" || entryResult.name == "greetBack") {
        const args = entryResult.args;
        return {
            name: "DISPLAY",
            description: "Summary",
            props: {
                content: args?.greeting ?? args?.answer ?? args?.question
            }
        }
    }

    console.log("We are handing over", entryResult.name, entryResult.args)

    const resource = resourcePrompt.build(prompt_with_history)
    const resourceResult = await Effect.runPromise(resource)

    const content = `
    <inquiry>
    ${input}
    </inquiry>
    <answer>
    ${resourceResult.answer}
    </answer>
    `
    const uiBlocks = uiBlockPrompt.build(content)

    const uiBlockResponse = await Effect.runPromise(uiBlocks)

    return uiBlockResponse
}
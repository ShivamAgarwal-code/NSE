/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-as-const */
import { Effect } from "effect";
import { Goal } from "./orchestrater";
import { createPrompt, sendToLLM } from "./utils";
import zodToJsonSchema from "zod-to-json-schema";
import { z } from "zod";


export class Oracle<QuerySchema = any, ResultData = any> {
    __type: "Oracle" = "Oracle"
    private Reader: (args: QuerySchema) => Effect.Effect<ResultData | null, unknown, never>
    Name: string
    Description: string
    ResponeSchema: Zod.ZodTypeAny
    QuerySchema: Zod.ZodTypeAny

    constructor(
        name: string,
        description: string,
        responseSchema: Zod.ZodTypeAny,
        querySchema: Zod.ZodTypeAny,
        reader: (args: QuerySchema) => Effect.Effect<ResultData, unknown, never>
    ) {
        this.Name = name
        this.Description = description
        this.ResponeSchema = responseSchema
        this.QuerySchema = querySchema
        this.Reader = reader
    }


    Read(args: Goal) {
        const { directive, task } = args
        const schema = this.QuerySchema
        const reader = this.Reader
        return Effect.tryPromise({
            try: async () => {
                const prompt = createPrompt(
                    {
                        role: "system",
                        name: "createQueryParams",
                        content: `
                        I AM A HUMAN ASSISTANT, MY PRIME DIRECTIVE IS TO: ${directive}
                        <task>
                        MY CURRENT TASK IS:
                        ${task}
                        
                        IN ORDER TO COMPLETE THIS TASK I NEED TO QUERY THIS DATA SOURCE:
                        DATA SOURCE NAME ${this.Name}
                        DATA SOURCE DESCRIPTION ${this.Description}
                        </task>
                        <main-instruction>
                        Construct a query for this data source
                        </main-instruction>
                        `
                    },
                    {
                        name: "createQueryParams",
                        description: "Create Query Parameters for the current data source",
                        parameters: zodToJsonSchema(z.object({
                            params: schema
                        }))
                    },
                    "createQueryParams"
                )

                const result = await sendToLLM(prompt)

                const asJson = JSON.parse(result)?.params

                const parsed = schema.safeParse(asJson)

                if (!parsed.success) {
                    console.log(`Oracle Error $`, parsed.error)
                    return null
                }

                return parsed.data as QuerySchema
            },
            catch(error) {
                console.log("Something went wrong", error)
                return error
            }
        }).pipe(
            Effect.andThen(
                (data)=> data ? reader(data) : Effect.succeed(null)
            )
        )
    }

    static define<QuerySchema = any, ResultData = any>(args: {
        name: string,
        description: string, 
        responseSchema: Zod.ZodTypeAny,
        querySchema: Zod.ZodTypeAny
        reader: (args: QuerySchema) => Effect.Effect<ResultData | null, unknown, never>,
    }){
        return new Oracle<QuerySchema, ResultData | null>(args.name, args.description, args.responseSchema, args.querySchema, args.reader)
    }



}
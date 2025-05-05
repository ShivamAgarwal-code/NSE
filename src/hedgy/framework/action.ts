/* eslint-disable @typescript-eslint/prefer-as-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Functionality to carry out a certain task
// May or may not interface with the oracles
// May act on its own with no side effects to the ozone

import { Effect } from "effect/Effect"
import { ContextItem, Goal } from "./orchestrater"



export class Action<Input = any, Output = any> {
    __type: "Action" = "Action"
    Name: string 
    Description: string
    OutputSchema: Zod.ZodTypeAny
    InputSchema: Zod.ZodTypeAny
    private Action: (args: Input, goal: Goal, context: Array<ContextItem>) => Effect<Output, unknown, never>

    constructor(name: string, description: string, outputSchema: Zod.ZodTypeAny, inputSchema: Zod.ZodTypeAny, action: (args: Input, goal: Goal, context: Array<ContextItem>) => Effect<Output, unknown, never>) {
        this.Name = name
        this.Description = description
        this.OutputSchema = outputSchema
        this.InputSchema = inputSchema
        this.Action = action
    }

    Do(args: Input, goal: Goal, context: Array<ContextItem>) {
        return this.Action(args, goal, context)
    }

    static define<I = any, O = any>(args: {
        name: string,
        description: string,
        outputSchema: Zod.ZodTypeAny,
        inputSchema: Zod.ZodTypeAny,
        action: (args: I, goal: Goal, context: Array<ContextItem>) => Effect<O, unknown, never>
    }){
        return new Action<I, O>(args.name, args.description, args.outputSchema, args.inputSchema, args.action)
    }

}
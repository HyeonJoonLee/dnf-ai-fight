export class AiOverloadedError extends Error {
    constructor(message = "AI_OVERLOADED") {
        super(message);
        this.name = "AiOverloadedError";
    }
}
import { describe, it, expect } from "vitest"
import { workerProxy } from "../src/workerProxy"
import { Foo } from "./Foo"

describe("workerProxy", () => {
	const WORKER_PATH = "/foo.worker.js"
	const expectedFoo = new Foo()

	it("should call worker", async () => {
		const foo = await workerProxy<Foo>(WORKER_PATH)
		expect(await foo.foo()).toBe(expectedFoo.foo())
	})

	it("should get property value", async () => {
		const foo = await workerProxy<Foo>(WORKER_PATH)
		const res: string = await foo.baz()

		expect(res).toBe(expectedFoo.baz)
	})

	it("should call async worker method", async () => {
		const foo = await workerProxy<Foo>(WORKER_PATH)
		const res: string = await foo.asyncFoo()

		expect(res).toBe(await expectedFoo.asyncFoo())
	})

	it("should call worker multiple times", async () => {
		const foo = await workerProxy<Foo>(WORKER_PATH)
		const res = await Promise.all([foo.foo(), foo.bar(), foo.foo()])

		expect(res).toEqual([
			expectedFoo.foo(),
			expectedFoo.bar(),
			expectedFoo.foo(),
		])
	})

	it("should pass arguments to worker and return it back", async () => {
		const foo = await workerProxy<Foo>(WORKER_PATH)
		const args = [
			"passing",
			"some",
			"args",
			1234,
			{ an: "object" },
			["an", "array", 123],
		]
		const res = await foo.identity(...args)

		expect(res).toEqual(expectedFoo.identity(...args))
	})

	it("should timeout if worker fails to load", async () => {
		await expect(
			workerProxy<Foo>("invalid-path", { loadTimeout: 500 }),
		).rejects.toThrow("Worker failed to load")
	})

	it("it should throw error straight from the worker", async () => {
		const foo = await workerProxy<Foo>(WORKER_PATH)
		const errMessage = "Inner error message"

		await expect(foo.raise(new Error(errMessage))).rejects.toThrow(
			`Error: ${errMessage}`,
		)
	})
})

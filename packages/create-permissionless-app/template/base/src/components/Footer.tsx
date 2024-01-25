import React from "react"

export const Footer = () => {
    return (
        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left">
            <a
                href="https://docs.pimlico.io/permissionless"
                className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                target="_blank"
                rel="noopener noreferrer"
            >
                <h2 className={"mb-3 text-2xl font-semibold"}>
                    Docs{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                        -&gt;
                    </span>
                </h2>
                <p className={"m-0 max-w-[30ch] text-sm opacity-50"}>
                    Find in-depth information about permissionless features and
                    API.
                </p>
            </a>

            <a
                href="https://docs.pimlico.io/permissionless/how-to"
                className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                target="_blank"
                rel="noopener noreferrer"
            >
                <h2 className={"mb-3 text-2xl font-semibold"}>
                    Tutorials{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                        -&gt;
                    </span>
                </h2>
                <p className={"m-0 max-w-[30ch] text-sm opacity-50"}>
                    Learn about permissionless with tutorials!
                </p>
            </a>
        </div>
    )
}

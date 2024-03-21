import Image from "next/image"
import React from "react"

export const Header: React.FC = () => {
    return (
        <div className="flex items-center justify-between font-mono text-sm">
            <div>
                <a
                    className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
                    href="https://pimlico.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    By{" "}
                    <Image
                        src="https://assets-global.website-files.com/651a9b6967ba4bcbcf84984e/651aa1d411a7884afa490723_pimlico_logo.svg"
                        alt="Pimlico Logo"
                        width={170}
                        height={26}
                        priority
                    />
                </a>
            </div>
        </div>
    )
}

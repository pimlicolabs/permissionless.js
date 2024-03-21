import { Footer, Header } from "@/components"
import React from "react"

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center gap-8 justify-between p-24">
            <Header />
            <Footer />
        </main>
    )
}

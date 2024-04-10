import { Footer, Header, PrivyAuth } from "@/components"

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center gap-8 justify-between p-24">
            <Header />
            <PrivyAuth />
            <Footer />
        </main>
    )
}

import type { PrivyClientConfig } from "@privy-io/react-auth"

export const privyConfig: PrivyClientConfig = {
    embeddedWallets: {
        createOnLogin: "all-users",
        requireUserPasswordOnCreate: true,
        noPromptOnSignature: false
    },
    loginMethods: ["wallet", "email", "sms"],
    appearance: {
        theme: "light",
        accentColor: "#676FFF",
        logo: "https://avatars.githubusercontent.com/u/125581500?s=200&v=4"
    }
}

import { OrganizationProfile } from "@clerk/nextjs"

const Settingspage = () => {
    return (
        <div className="w-full">
            <OrganizationProfile
                appearance={{
                    elements: {
                        rootBox: {
                            boxShadow: "none",
                            width: "100%",
                        },
                        card: {
                            border: "1px solid #e5e5e5",
                            boxShadow: "none",
                            width: "100%",
                        }
                    }
                }}
            />
        </div>
    )
}

export default Settingspage
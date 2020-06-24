const getFrontendUrl = () =>
    process.env.NODE_ENV === "production"
        ? "https://inquest.dev/"
        : `http://localhost:${process.env.FRONTEND_HOST || 4000}`;

module.exports = {
    title: "Inquest",
    tagline: "The tagline of my site",
    url: "https://inquest.dev/docs",
    baseUrl: "/",
    favicon: "https://inquest.dev/resources/favicon.ico",
    organizationName: "yiblet", // Usually your GitHub org/user name.
    projectName: "inquest", // Usually your repo name.
    themeConfig: {
        navbar: {
            title: "Inquest",
            logo: {
                alt: "Site Logo",
                href: getFrontendUrl(),
                target: "_self" // By default, this value is calculated based on the `href` attribute (the external link will open in a new tab, all others in the current one).
            },
            links: [
                {
                    to: "docs/",
                    activeBasePath: "docs",
                    label: "Docs",
                    position: "left"
                },
                {
                    href: "https://github.com/yiblet/inquest",
                    label: "GitHub",
                    position: "right"
                }
            ]
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Docs",
                    items: [
                        {
                            label: "Getting Started",
                            to: "docs/"
                        },
                        {
                            label: "Self-Hosting",
                            to: "docs/getting_started_with_docker"
                        }
                    ]
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "GitHub",
                            href: "https://github.com/yiblet/inquest"
                        },
                        {
                            label: "Home",
                            href: getFrontendUrl()
                        },
                        {
                            label: "Built With Docusaurus",
                            href: "https://github.com/facebook/docusaurus"
                        },
                    ]
                }
            ],
            copyright: `© ${new Date().getFullYear()} Inquest`
        }
    },
    presets: [
        [
            "@docusaurus/preset-classic",
            {
                docs: {
                    // It is recommended to set document id as docs home page (`docs/` path).
                    homePageId: "getting_started",
                    sidebarPath: require.resolve("./sidebars.js"),
                    // Please change this to your repo.
                    editUrl:
                        "https://github.com/yiblet/inquest/edit/master/docs/"
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css")
                }
            }
        ]
    ]
};

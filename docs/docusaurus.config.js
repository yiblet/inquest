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
            links: [
                {
                    to: "docs/",
                    activeBasePath: "docs",
                    label: "Docs",
                    position: "left"
                },
                {
                    href: "https://github.com/facebook/docusaurus",
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
                            label: "Style Guide",
                            to: "docs/"
                        }
                    ]
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "GitHub",
                            href: "https://github.com/facebook/docusaurus"
                        }
                    ]
                }
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Inquest. Built with Docusaurus.`
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

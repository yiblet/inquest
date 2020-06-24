import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import Typist from "react-typist";

const features = [
    {
        title: "Instrument Your Python Quickly",
        imageUrl: "img/undraw_To_the_stars_qhyy.svg",
        description: (
            <>
                Inquest let's you add log statements like you add break points
                in debugger. Just click, point, and see your logs.
            </>
        )
    },
    {
        title: "Easy Setup",
        imageUrl: "img/undraw_publish_article_icso.svg",
        description: (
            <>
                Get started with a simple <code>pip install</code> and an{" "}
                <code>inquest.enable()</code>
                <a href="/docs"> Learn more </a>
            </>
        )
    },
    {
        title: "We're Open Source",
        imageUrl: "img/undraw_developer_activity_bv83.svg",
        description: (
            <>
                You can contribute or host everything all on one laptop.
                <a href="/docs/getting_started_with_docker"> Learn more </a>
            </>
        )
    }
];

function Feature({ imageUrl, title, description }) {
    const imgUrl = useBaseUrl(imageUrl);
    return (
        <div className={clsx("col col--4", styles.feature)}>
            {imgUrl && (
                <div className="text--center">
                    <img
                        className={styles.featureImage}
                        src={imgUrl}
                        alt={title}
                    />
                </div>
            )}
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}

function Home() {
    const context = useDocusaurusContext();
    const { siteConfig = {} } = context;
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <header className={clsx("hero hero--primary", styles.heroBanner)}>
                <div className={clsx("container", styles.heroContainer)}>
                    <div className={styles.heroContent}>
                        <h1 className="hero__title">
                            <span>Setup Inquest To Run In </span>
                            <Typist>
                                <span> Your Computer </span>
                                <Typist.Backspace count={14} delay={1000} />
                                <span> Your Cloud </span>
                                <Typist.Backspace count={14} delay={1000} />
                                <span> Inquest Cloud </span>
                            </Typist>
                        </h1>
                        <div className={styles.buttons}>
                            <Link
                                className={clsx(styles.button)}
                                to={useBaseUrl("docs")}
                            >
                               See The Docs 
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <main>
                {features && features.length && (
                    <section className={styles.features}>
                        <div className="container">
                            <div className="row">
                                {features.map((props, idx) => (
                                    <Feature key={idx} {...props} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </Layout>
    );
}

export default Home;

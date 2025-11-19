import { Helmet } from "react-helmet-async";

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
}

export const SEO = ({ title, description, image, url }: SEOProps) => {
    const siteTitle = "BV Celular";
    const fullTitle = `${title} | ${siteTitle}`;
    const defaultDescription =
        "A melhor loja de smartphones e acessórios da região.";
    const defaultImage = "/og-image.jpg"; // Coloque uma imagem padrão na pasta public

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta
                name="description"
                content={description || defaultDescription}
            />

            {/* Open Graph / WhatsApp */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle} />
            <meta
                property="og:description"
                content={description || defaultDescription}
            />
            <meta property="og:image" content={image || defaultImage} />
            <meta property="og:url" content={url || window.location.href} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta
                name="twitter:description"
                content={description || defaultDescription}
            />
            <meta name="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
};

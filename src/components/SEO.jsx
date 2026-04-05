import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, url, type = 'website', schema = null, image = '/assets/logo.png' }) {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://homizgo.in';
  const fullUrl = `${siteUrl}${url}`;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const twitterHandle = import.meta.env.VITE_TWITTER_HANDLE || '@homizgo';

  // Fallbacks
  const seoTitle = title ? `${title} | Homizgo - Premium PG & Flat Rentals` : 'Homizgo | Find the Best PGs & Flats for Rent';
  const seoDesc = description || 'Discover top-rated PG accommodations, hostels, and flats for rent near you. Homizgo connects students and professionals with verified landlords securely.';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />
      <meta name="description" content={seoDesc} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDesc} />
      <meta property="og:image" content={fullImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDesc} />
      <meta property="twitter:image" content={fullImage} />
      <meta property="twitter:creator" content={twitterHandle} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

module.exports = {
  pathPrefix: "/didcomm.org",
  siteMetadata: {
    title: `DIDComm`,
    description: `TODO description`,
    author: `DIDComm`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `protocols`,
        path: `${__dirname}/content/protocols`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/content/pages`,
      },
    },
    `gatsby-transformer-remark`,
    `gatsby-plugin-use-query-params`,
    {
      resolve: `gatsby-plugin-page-creator`,
      options: {
        path: `${__dirname}/src/pages`,
        ignore: [`*.types.(js|ts)?(x)`],
      },
    },
    `gatsby-plugin-sass`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `DIDComm`,
        short_name: `DIDComm`,
        start_url: `/`,
        background_color: `#FFF`,
        theme_color: `#FFF`,
        display: `minimal-ui`,
        icon: `src/images/didcomm-logo.svg`, // This path is relative to the root of the site.
      },
    },
  ],
}

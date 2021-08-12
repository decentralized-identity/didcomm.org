module.exports = {
  siteMetadata: {
    title: `DIDComm`,
    description: `TODO description`,
    author: `DIDComm`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
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
    `gatsby-transformer-remark`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-use-query-params`
    // {
    //   resolve: `gatsby-plugin-manifest`,
    //   options: {
    //     name: `DIDComm`,
    //     short_name: `DIDComm`,
    //     start_url: `/`,
    //     background_color: `#663399`,
    //     theme_color: `#663399`,
    //     display: `minimal-ui`,
    //     icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
    //   },
    // }
  ],
}

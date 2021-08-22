module.exports = {
  pathPrefix: '/didcomm.org',
  siteMetadata: {
    title: `DIDComm`,
    description: `DIDComm lets people and software use DIDs to communicate securely and privately over many channels: the web, email, mobile push notifications, QR codes, Bluetooth, message queues, sneakernet, and more.`,
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
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: 'gatsby-remark-copy-linked-files',
            options: {
              ignoreFileExtensions: [],
            },
          },
        ],
      },
    },
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

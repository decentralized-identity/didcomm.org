import { Feature } from '../components/Features/Features.type'

export type QueryData = {
  markdownRemark: {
    frontmatter: {
      features: Array<Feature>
    }
  }
}

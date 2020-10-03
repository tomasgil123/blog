import React from 'react'
import PostType from 'src/types/post'
import PageWithLayoutType from 'src/types/pageWithLayout'
import { getLastThreePosts } from 'src/lib/posts'

import Layout from 'src/components/layout/mainLayout'
import Landing from 'src/domain/home/landing'
import AboutMe from 'src/domain/home/about'
import Portfolio from 'src/domain/home/portfolio'
import Posts from 'src/domain/home/posts'
import Contact from 'src/domain/home/contact'

type HomeProps = {
  lastThreePosts: PostType[]
}

const Home: React.FC<HomeProps> = ({ lastThreePosts }) => {
  return (
    <div>
      <Landing />
      <AboutMe />
      <Portfolio />
      <Posts lastThreePosts={lastThreePosts} />
      <Contact />
    </div>
  )
}

;(Home as PageWithLayoutType).layout = Layout

export default Home

export const getStaticProps = async (): Promise<unknown> => {
  const lastThreePosts = getLastThreePosts([
    'title',
    'date',
    'slug',
    'author',
    'coverImage',
    'excerpt',
  ])

  return {
    props: { lastThreePosts },
  }
}

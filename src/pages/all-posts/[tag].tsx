import React, { useEffect } from 'react'
import { GetStaticProps, GetStaticPaths } from 'next'
import { PostThumbnail } from 'src/types/post'
import PageWithLayout from 'src/types/pageWithLayout'
import { getAllPosts } from 'src/lib/posts'

// * Utils *
import { getMainTags } from 'src/utils/tags'

// * Components *
import Layout from 'src/components/layout/mainLayout'
import Posts from 'src/domain/home/posts'

type ListPostsProps = {
  posts: PostThumbnail[]
  tag: string
}

const ListPosts: React.FC<ListPostsProps> = ({ posts, tag }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <div>
      <Posts posts={posts} tag={tag} />
    </div>
  )
}

;(ListPosts as PageWithLayout).layout = Layout

export default ListPosts

//if we dont add the async to getStaticPath we get a weird error

export const getStaticPaths: GetStaticPaths = async () => {
  getMainTags
  return {
    paths: [
      ...getMainTags.map((tag) => {
        return { params: { tag: tag } }
      }),
    ],
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postAttributes = {
    title: '',
    date: '',
    slug: '',
    coverImage: '',
    tags: '',
  }
  const allPosts = getAllPosts<typeof postAttributes>(Object.keys(postAttributes))
  const posts = allPosts.filter((post) => post.tags.includes(params.tag as string))

  return {
    props: { posts: posts, tag: params.tag as string },
  }
}

import React from 'react'
import { PostType } from 'src/types/post'
import PageWithLayoutType from 'src/types/pageWithLayout'
import { getPostBySlug, getAllPosts } from 'src/lib/posts'

import PostBody from 'src/domain/post/postBody'
import Layout from 'src/components/layout/postlayout'

type PostPageProps = {
  post: PostType
}

const PostPage: React.FC<PostPageProps> = ({ post }) => {
  return (
    <>
      <PostBody source={post.content} />
    </>
  )
}

;(PostPage as PageWithLayoutType).layout = Layout

export default PostPage

type Params = {
  params: {
    slug: string
  }
}

export async function getStaticProps({ params }: Params): Promise<unknown> {
  const postAttributes = {
    title: '',
    date: '',
    slug: '',
    author: '',
    content: '',
    ogImage: '',
    coverImage: '',
  }
  const post = getPostBySlug<typeof postAttributes>(params.slug, Object.keys(postAttributes))

  return {
    props: {
      post: {
        ...post,
      },
    },
  }
}

export async function getStaticPaths(): Promise<unknown> {
  const postAttributes = { slug: '', date: '' }
  const posts = getAllPosts<typeof postAttributes>(Object.keys(postAttributes))

  return {
    paths: posts.map((posts) => {
      return {
        params: {
          slug: posts.slug,
        },
      }
    }),
    fallback: false,
  }
}

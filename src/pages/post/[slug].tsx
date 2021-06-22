/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-param-reassign */
import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: string;
      text: string;
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const readTime = useMemo(() => {
    if (!post) {
      return 0;
    }

    const words = post.data.content
      .reduce((acc, item) => {
        return acc + item.heading + item.text;
      }, '')
      .split(/ /g);

    return Math.ceil(words.length / 200);
  }, [post]);

  if (isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Post | space.traveling</title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <time>
              <FiCalendar />
              {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <span className={commonStyles.author}>
              <FiUser /> {post.data.author}
            </span>
            <span className={commonStyles.time}>
              <FiClock />
              {readTime > 0 ? `${readTime} min` : 'Carregando'}
            </span>
          </div>
          {post.data.content.map((content, index) => (
            <article key={`content__${index}`}>
              <h2>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: content.body }} />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    ...response,

    data: {
      ...response.data,
      title: response.data.title,
      banner: response.data.banner,
      author: response.data.author,

      content: response.data.content.map(item => {
        item.text = RichText.asText(item.body);
        item.body = RichText.asHtml(item.body);
        return item;
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 10,
  };
};

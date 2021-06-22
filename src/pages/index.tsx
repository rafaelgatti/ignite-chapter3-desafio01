import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';

import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleLoadNextpage = (): void => {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const { next_page, results } = data;

        const newPosts = results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setNextPage(next_page);
        setPosts(posts.concat(newPosts));
      });
  };

  return (
    <>
      <Head>
        <title>Home | space.traveling</title>
      </Head>

      <Header />
      <main className={commonStyles.container}>
        {posts.map(post => {
          return (
            <div key={post.uid} className={styles.post}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div className={commonStyles.info}>
                    <time>
                      <FiCalendar />
                      {format(
                        parseISO(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <span className={commonStyles.author}>
                      <FiUser /> {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            </div>
          );
        })}

        {nextPage && (
          <button
            className={styles.morePosts}
            type="button"
            onClick={handleLoadNextpage}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  // const posts = postsResponse.results.map(post => {
  //   return {
  //     uid: post.uid,
  //     first_publication_date: format(
  //       parseISO(post.first_publication_date),
  //       'dd MMM yyyy',
  //       {
  //         locale: ptBR,
  //       }
  //     ),
  //     data: {
  //       title: post.data.title,
  //       subtitle: post.data.subtitle,
  //       author: post.data.author,
  //     },
  //   };
  // });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
  };
};

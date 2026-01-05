import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath", "lang");

export async function generateMetadata(props: any) {
  const params = await props.params;
  const mdxPath = params.mdxPath ?? [];
  const { metadata } = await importPage(mdxPath, params.lang);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: any) {
  const params = await props.params;
  const mdxPath = params.mdxPath ?? [];
  const lang = params.lang;
  console.log({ mdxPath, lang });
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(mdxPath, lang);

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}

import PageView from "./page-view";
import { getDictionary } from "@/app/dictionaries";

type Locale = "en" | "bn" | "ar";

export default async function Page({
  params,
}: {
  params: { lang: Locale };
}) {
  const trans = await getDictionary(params.lang);
  return <PageView trans={trans} />;
}

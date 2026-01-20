    import DashboardPageView from "./page-view";
    import { getDictionary } from "@/app/dictionaries";
    
    interface PageProps {
      params: {
        lang: any;
      };
    }
    
    export default async function Page({ params: { lang } }: PageProps) {
      const trans = await getDictionary(lang);
      return <DashboardPageView trans={trans} />;
    }
    
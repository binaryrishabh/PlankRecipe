import { config } from "../utils/config";
import { fetchRecipeHtml as curlHtml, fetchReviews as curlReviews } from "./fetchers/curlFetcher";
import { fetchRecipeHtml as pwHtml, fetchReviews as pwReviews } from "./fetchers/playwrightFetcher";

// picks the scraping engine from SCRAPER_ENGINE in the env.
// local dev runs curl (no chromium download hassle on windows),
// prod runs playwright since aws datacenter ips get hard blocked
// by cloudflare and only a real headless browser gets through.
// both engines expose the same two functions, so the scraper doesnt
// care which one is running under the hood
const usePlaywright = config.SCRAPER_ENGINE === "playwright";

export const fetchRecipeHtml = usePlaywright ? pwHtml : curlHtml;
export const fetchReviews = usePlaywright ? pwReviews : curlReviews;
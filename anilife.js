class AniLifeSource {
    constructor() {
        this.name = "AniLife";
        this.baseUrl = "https://anilife01.tv";
        this.lang = "ko";
        this.type = "anime"; // MangaYomi 애니메이션 타입
    }

    // 기본 헤더 설정 (필요 시 로그인 쿠키/세션 입력 가능)
    getHeaders() {
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": this.baseUrl + "/"
        };
    }

    // 1. 애니메이션 목록 검색 / 가져오기
    async getPopular(page) {
        const url = `${this.baseUrl}/anime?page=${page}`;
        const res = await fetch(url, { headers: this.getHeaders() });
        const html = await res.text();
        
        // DOM 파싱 (MangaYomi 내부 DOMParser / Cheerio 사용)
        const doc = new DOMParser().parseFromString(html, "text/html");
        const items = doc.querySelectorAll(".anime-item, .item-card"); // 사이트 클래스 구조에 대응
        
        let list = [];
        items.forEach(el => {
            const title = el.querySelector(".title")?.textContent.trim() || "";
            const href = el.querySelector("a")?.getAttribute("href") || "";
            const cover = el.querySelector("img")?.getAttribute("src") || "";
            
            if (href) {
                list.push({
                    name: title,
                    link: href.startsWith("http") ? href : this.baseUrl + href,
                    imageUrl: cover.startsWith("http") ? cover : this.baseUrl + cover
                });
            }
        });
        
        return { list, hasNextPage: list.length > 0 };
    }

    // 2. 애니메이션 상세 정보 및 에피소드 목록 추출
    async getDetail(url) {
        const res = await fetch(url, { headers: this.getHeaders() });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        const description = doc.querySelector(".desc, .summary")?.textContent.trim() || "";
        const episodes = [];

        // 회차 목록 파싱
        const epElements = doc.querySelectorAll(".episode-list a, .ep-item a");
        epElements.forEach((el, index) => {
            const name = el.textContent.trim() || `Episode ${index + 1}`;
            const link = el.getAttribute("href");
            
            episodes.push({
                name: name,
                url: link.startsWith("http") ? link : this.baseUrl + link
            });
        });

        return {
            description: description,
            episodes: episodes.reverse() // 최신화/1화 순서에 맞춰 조정
        };
    }

    // 3. 비디오 플레이어 Stream URL 추출
    async getVideoList(episodeUrl) {
        const res = await fetch(episodeUrl, { headers: this.getHeaders() });
        const html = await res.text();
        
        // iframe 또는 video 태그 내 m3u8 / mp4 주소 파싱
        const doc = new DOMParser().parseFromString(html, "text/html");
        let videoUrl = doc.querySelector("iframe")?.getAttribute("src") || doc.querySelector("video source")?.getAttribute("src");

        if (!videoUrl) {
            // 스크립트 내부 파일 URL 정규식 추출 fallback
            const match = html.match(/(https?:\/\/[^\s"'<>]+\.(m3u8|mp4))/i);
            if (match) videoUrl = match[1];
        }

        if (!videoUrl) return [];

        return [{
            url: videoUrl,
            quality: "Auto / 1080p",
            originalUrl: episodeUrl,
            headers: this.getHeaders()
        }];
    }
}

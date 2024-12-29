// index.mjs
import fs from "fs";
import readline from "readline";
import { openCityDB, getCityByIP } from "./geoLookup.mjs";

// IPv4만 간단히 추출하는 정규표현식 예시 (IPv6가 필요하면 다른 정규식이 필요합니다)
const ipRegex = /(\b\d{1,3}\.){3}\d{1,3}\b/g;

async function processFile() {
  // 1) GeoLite2-City DB 열기
  await openCityDB();

  // 2) source-data.txt를 스트림 모드로 읽어들임
  const fileStream = fs.createReadStream("source-data.txt");

  // 3) readline 인터페이스 생성
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // 4) 파일을 한 줄씩 읽어서 처리
  for await (const line of rl) {
    const trimmedLine = line.trim();
    // 주석(#)이거나 빈 줄이면 건너뜀
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // (1) CSV 컬럼 파싱
    //    따옴표로 감싸진 CSV 형태이므로, 정규식으로 "내용"에 매칭하고 앞뒤 따옴표를 제거
    const columns = trimmedLine.match(/"([^"]*)"/g);
    if (!columns || columns.length < 9) {
      // CSV 양식이 아니거나 컬럼이 부족하면 스킵
      continue;
    }
    // 컬럼 배열에서 앞뒤 따옴표 제거
    const parsedColumns = columns.map((col) => col.replace(/^"|"$/g, ""));

    // 필요한 컬럼을 구조 분해 할당
    // index:    0        1               2     3           4            5               6              7                   8
    // 예)     [id,  dateadded,        url,  url_status, last_online,  threat,         tags,         urlhaus_link,      reporter]
    const [
      id,
      dateadded,
      url,
      url_status,
      last_online,
      threat,
      tags,
      urlhaus_link,
      reporter,
    ] = parsedColumns;

    // (2) IP 정규표현식 매칭
    //     여기서는 line 전체에서 추출하지만, 필요하다면 url 컬럼만 매칭해도 됨.
    const matchedIPs = line.match(ipRegex);
    if (!matchedIPs) {
      continue;
    }

    // (3) 중복 IP 제거
    const uniqueIPs = [...new Set(matchedIPs)];

    // (4) 각각의 IP를 조회
    for (const ip of uniqueIPs) {
      const cityData = getCityByIP(ip);
      if (!cityData) {
        console.error(
          `IP: ${ip}, [GeoIP 데이터 없음], [CSV: ID=${id}, URL=${url}]`
        );
        continue;
      }

      const {
        countryName,
        isoCode,
        cityName,
        latitude,
        longitude,
        postalCode,
      } = cityData;

      // 원하는 형식으로 콘솔 출력
      // CSV의 컬럼(id, url 등)도 함께 표출
      // console.log(
      //   `IP: ${ip}\n` +
      //     ` - Country : ${countryName} (${isoCode})\n` +
      //     ` - City    : ${cityName}\n` +
      //     ` - Lat/Lng : ${latitude}, ${longitude}\n` +
      //     ` - Postal  : ${postalCode}\n` +
      //     ` - CSV 정보: [id=${id}, dateadded=${dateadded}, url=${url}, threat=${threat}]\n`
      // );

      console.log(
        `"${dateadded}","${isoCode}","${url_status}","${last_online}","${ip}","${url}","${threat}"`
      );
    }
  }

  // 스트림 닫기
  rl.close();
}

// 실행
processFile().catch((err) => {
  console.error("파일 처리 중 오류:", err.message);
});

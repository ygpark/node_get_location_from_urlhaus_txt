// geoLookup.js
import maxmind from "maxmind";

/**
 * City DB 핸들러
 */
let cityLookup = null;

/**
 * GeoLite2-City.mmdb 파일을 오픈하는 함수
 */
export async function openCityDB() {
  if (!cityLookup) {
    // './GeoLite2-City.mmdb' 경로는 상황에 맞게 수정하세요.
    cityLookup = await maxmind.open("./GeoLite2-City.mmdb");
  }
}

/**
 * IP로부터 도시 정보를 가져오는 함수
 * @param {string} ip IPv4 또는 IPv6
 * @returns {object|null} { countryName, isoCode, cityName, lat, lng, postalCode } 등등
 */
export function getCityByIP(ip) {
  if (!cityLookup) {
    throw new Error("DB is not opened. 먼저 openCityDB()를 호출하세요.");
  }

  // cityLookup.get(ip) -> MaxMind에서 조회 결과 반환
  const result = cityLookup.get(ip);
  if (!result) {
    return null; // 조회 결과가 없으면 null
  }

  // GeoLite2-City.mmdb의 결과 예시 구조에 맞춰 필요한 필드를 추출
  const { country, city, location, postal } = result;

  const countryName = country?.names?.en || "Unknown";
  const isoCode = country?.iso_code || "Unknown";
  const cityName = city?.names?.en || "Unknown";
  const latitude = location?.latitude || 0;
  const longitude = location?.longitude || 0;
  const postalCode = postal?.code || "Unknown";

  return {
    countryName,
    isoCode,
    cityName,
    latitude,
    longitude,
    postalCode,
  };
}

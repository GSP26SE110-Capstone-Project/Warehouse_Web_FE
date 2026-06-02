import { api } from "../utils/Axios"

interface District {
  districtId: string
  districtName: string
}

interface City {
  cityId: string
  cityName: string
  districts: District[]
}

interface LocationApiResponse {
  success: boolean
  message: string
  data: {
    cities: City[]
  }
}

export const addressApi = {
  getAllLocations: () => {
    return api.get<LocationApiResponse>('/locations');
  }
}
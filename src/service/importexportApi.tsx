import { api } from "../utils/Axios"
import type { ImportExportReport, ImportExportRequest, ImportExportDetail, ImportExportResponse} from "../types/ImportExport"

export const importExportApi = {
    getAll: async () => {
        return api.get<ImportExportResponse>('/import-export-records')
    },
    getById: async (id: string) => {
        return api.get(`/import-export/records/${id}`)
    },
    create: async (request: ImportExportRequest) => {
        return api.post('/import-export/records', request)
    },
    updateStatus: (id: string, status: 'APPROVED' | 'CANCELED' | 'REJECTED' | 'PENDING') => {
        return api.patch(`/import-export-records/${id}`, {
            status: status
        });
    }
}
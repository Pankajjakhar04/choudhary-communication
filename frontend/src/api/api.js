import axios from 'axios'

const BASE = '/api'

const instance = axios.create({ baseURL: BASE })

// Request interceptor: attach token automatically
instance.interceptors.request.use(cfg => {
	const token = localStorage.getItem('adminToken')
	if (token) cfg.headers = { ...(cfg.headers||{}), Authorization: `Bearer ${token}` }
	return cfg
})

// Response interceptor: handle 401 globally
instance.interceptors.response.use(
	res => res,
	err => {
		if (err?.response?.status === 401){
			try{ localStorage.removeItem('adminToken') }catch(e){}
			if (typeof window !== 'undefined') window.location.href = '/admin/login'
		}
		return Promise.reject(err)
	}
)

// Public
export const getItems    = ()   => instance.get('/items')
export const getOffers   = ()   => instance.get('/offers')
export const getServices = ()   => instance.get('/services')

export const adminLogin  = (data) => instance.post('/auth/login', data)

// Admin (auth attached automatically)
export const addItem     = (formData) => instance.post('/items', formData)
export const updateItem  = (id, data) => instance.put(`/items/${id}`, data)
export const deleteItem  = (id)       => instance.delete(`/items/${id}`)

export const addOffer    = (data)     => instance.post('/offers', data)
export const updateOffer = (id, data) => instance.put(`/offers/${id}`, data)
export const deleteOffer = (id)       => instance.delete(`/offers/${id}`)

export const addService    = (data)     => instance.post('/services', data)
export const updateService = (id, data) => instance.put(`/services/${id}`, data)
export const deleteService = (id)       => instance.delete(`/services/${id}`)

// Settings
export const getSettings    = ()     => instance.get('/settings')
export const updateSettings = (data) => instance.put('/settings', data)

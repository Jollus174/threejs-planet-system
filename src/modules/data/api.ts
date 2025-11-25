import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API Request class that wraps Axios
 */
class APIRequest {
	private axiosInstance: AxiosInstance;

	constructor(timeout: number = 15000) {
		this.axiosInstance = axios.create({
			timeout,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	/**
	 * Get the underlying Axios instance for advanced use cases
	 */
	getAxiosInstance(): AxiosInstance {
		return this.axiosInstance;
	}

	/**
	 * Make a GET request
	 */
	async GET<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.axiosInstance.get<T>(url, config);
	}

	/**
	 * Make a POST request
	 */
	async POST<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.axiosInstance.post<T>(url, data, config);
	}

	/**
	 * Make a PUT request
	 */
	async PUT<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.axiosInstance.put<T>(url, data, config);
	}

	/**
	 * Make a PATCH request
	 */
	async PATCH<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.axiosInstance.patch<T>(url, data, config);
	}

	/**
	 * Make a DELETE request
	 */
	async DELETE<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.axiosInstance.delete<T>(url, config);
	}
}

// Create a singleton instance for easy use throughout the app
const api = new APIRequest();

export { APIRequest, api };

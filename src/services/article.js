import request from '@/utils/request';

const baseUrl = '/api/article';

export async function save(params) {
  return request(baseUrl, {
    method: 'POST',
    data: params,
    requestType: 'form',
  });
}
export async function del({ id }) {
  return request(`${baseUrl}/${id}`, {
    method: 'DELETE',
  });
}
export async function get({ id }) {
  return request(`${baseUrl}/${id}`);
}
export async function getPage(params) {
  return request(`${baseUrl}/list`, { params });
}

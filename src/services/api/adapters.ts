// API response adapters/transformers
export const adaptUserFromAPI = (apiUser: any) => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  role: apiUser.role,
});

export const adaptUserToAPI = (user: any) => ({
  name: user.name,
  email: user.email,
  role: user.role,
});

export const adaptPackageFromAPI = (apiPackage: any) => ({
  id: apiPackage.id,
  name: apiPackage.name,
  version: apiPackage.version,
  description: apiPackage.description,
});

export const adaptPackageToAPI = (pkg: any) => ({
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
});

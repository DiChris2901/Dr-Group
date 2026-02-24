import { useCompaniesContext } from '../context/CompaniesContext';

/**
 * useCompanies — Thin wrapper around CompaniesContext.
 * Preserves the original API { companies, loading, error, findCompanyByNIT }.
 * All consumers now share a single Firestore listener via CompaniesProvider.
 */
const useCompanies = () => {
  return useCompaniesContext();
};

export default useCompanies;

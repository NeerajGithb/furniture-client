type EmptyStateProps = {
  hasFilters: boolean;
  onClearFilters: () => void;
  isError?: boolean;
  errorMessage?: string;
  query?: string;
  isFallback?: boolean;
};
type ProductsPageProps = {
  params: {
    category?: string;
    subcategory?: string;
  };
};

export type { EmptyStateProps, ProductsPageProps };

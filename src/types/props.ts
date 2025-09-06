
type EmptyStateProps = {
  hasFilters: boolean;
  onClearFilters: () => void;
  isError?: boolean;
  errorMessage?: string;
};
type ProductsPageProps = {
  params: {
    category?: string;
    subcategory?: string;
  };
};

export type { EmptyStateProps, ProductsPageProps };


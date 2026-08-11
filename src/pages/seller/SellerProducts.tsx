// Seller Products page — shares the product-management implementation with
// artists, but keeps seller navigation context (back → seller dashboard).
import ArtistProducts from "@/pages/artist/ArtistProducts";

const SellerProducts = () => {
  return <ArtistProducts role="seller" />;
};

export default SellerProducts;

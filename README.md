# Shopping Feed Viewer

A modern web application for previewing and managing Meta/Facebook shopping feeds with exclusion capabilities.

## Features

- **Feed URL Input**: Enter any XML feed URL at the top and refresh to reprocess
- **Visual Preview**: See product images, titles, prices, and details in a clean grid layout
- **Exclusion Management**: Click "Exclude" on any item to mark it for exclusion
- **Search & Filter**: Search by product name, ID, or category
- **Category Filtering**: Filter by product categories automatically detected from the feed
- **Export Exclusions**: Download a JSON file with all excluded item IDs and details
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## How to Use

### 1. Getting Started
- Open `index.html` in your web browser
- The app loads with a sample item (PVC Mesh Banners) to demonstrate functionality

### 2. Loading Your Feed
- Enter your Meta feed URL in the input field at the top
- Click "Load Feed" or press Enter
- Click "Refresh" to reload the current feed

### 3. Previewing Items
- Browse through your products in the visual grid
- Each item shows:
  - Product image
  - Title and price
  - Category badge
  - Product details (ID, availability, condition, group ID)
  - Action buttons

### 4. Making Exclusions
- Click the "Exclude" button on any item you want to exclude
- Excluded items become grayed out with an "EXCLUDED" badge
- Click "Include" to remove an item from exclusions
- View exclusion stats in the top controls

### 5. Filtering & Search
- Use the search box to find specific products by name, ID, or category
- Use the category dropdown to filter by product type
- Stats update automatically based on current filters

### 6. Exporting Exclusions
- Click "Export Exclusions" to download a JSON file
- The file contains:
  - Timestamp of export
  - Original feed URL
  - List of excluded item IDs
  - Full details of excluded items

## Technical Details

### Supported Feed Formats
- Google Shopping XML feeds
- Meta/Facebook catalog feeds
- Any XML feed with `<item>` elements containing Google Shopping attributes

### CORS Handling
The application uses a CORS proxy (`api.allorigins.win`) to load external feeds. For production use, consider:
- Setting up your own backend proxy
- Serving feeds from the same domain
- Using a more reliable CORS solution

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (recent versions)

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md          # This documentation
```

## Sample Feed Format

The application expects XML feeds with items like:

```xml
<item>
    <g:id>16409</g:id>
    <g:title>PVC Mesh Banners</g:title>
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:price>GBP 120.00</g:price>
    <g:link>https://example.com/product</g:link>
    <g:image_link>https://example.com/image.jpg</g:image_link>
    <g:item_group_id>2471</g:item_group_id>
    <product_type>Category > Subcategory</product_type>
</item>
```

## Customization

### Adding New Fields
To display additional product fields:
1. Add the field to the `parseItem()` method in `script.js`
2. Update the `createItemElement()` method to display the field
3. Optionally add the field to search functionality

### Styling
Modify `styles.css` to customize:
- Colors and branding
- Layout and spacing
- Responsive breakpoints
- Animation effects

## Troubleshooting

### Feed Won't Load
- Check that the URL is accessible and returns valid XML
- Verify the feed contains `<item>` elements
- Try the sample data first to ensure the app is working

### Images Not Showing
- Check that image URLs are accessible
- Verify CORS settings on the image server
- The app includes fallback placeholder images

### CORS Errors
- The app uses a public CORS proxy which may have limitations
- For production, implement your own backend proxy
- Some feeds may block proxy access

## License

This project is open source and available under the MIT License. 
# Admin Panel Setup Instructions

## Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Access the admin panel:**
   - Open your browser and go to: `http://localhost:3001/admin`
   - Or directly open: `http://localhost:3001/admin.html`

3. **Admin Login:**
   - Default admin password: `admin123`
   - You can change this in `routes/admin.js` (line 8)

## Admin Features

- ✅ **Add new menu items** - Create dishes with name, category, price, image path, and food type (veg/non-veg) + options (spicy, popular)
- ✅ **Edit existing items** - Click edit button to modify any menu item
- ✅ **Delete items** - Remove items from the menu
- ✅ **Statistics dashboard** - View total items, categories, and popular items count
- ✅ **Dynamic menu** - All changes are immediately reflected on the main website
- ✅ **Image preview** - See food item images directly in the admin table
- ✅ **Vegetarian/Non-vegetarian** - Proper radio button selection for food type

## Menu Categories

The system supports these categories:
- Starters
- Main Course  
- Desserts
- Beverages

## Image Path Format

When adding images, use the path format: `assets/images/filename.png`

Example: `assets/images/paneer-tikka.png`

## Database

- Menu items are stored in MongoDB
- Database name: `tindibandi`
- Collection: `menuitems`
- The system automatically initializes with sample menu data if the database is empty

## Main Website

- Menu on main website is now fully dynamic
- Changes in admin panel appear immediately on: `http://localhost:3001/`
- Search functionality works with live menu data
- Chatbot provides dynamic responses based on current menu
- **Image display** - All menu item images show properly with fallback support
- **Profile management** - User profile dropdown with name, email, phone, and logout
- **Better authentication** - Login/register buttons properly hide when user is logged in

## Security Note

**Important:** Change the admin password in production!

Edit `routes/admin.js` line 8:
```javascript
const ADMIN_SECRET = 'your-secure-password'; // Change this!
```

## Troubleshooting

1. **Can't access admin panel?**
   - Make sure server is running on port 3001
   - Check console for any errors

2. **Admin login not working?**
   - Verify you're using the correct password (`admin123` by default)
   - Check browser console for network errors

3. **Menu not updating?**
   - Ensure MongoDB is running
   - Check server console for database connection errors

4. **Images not showing?**
   - Verify image files are in `public/assets/images/` folder
   - Check that image paths in admin panel don't start with `/`
   - Use format: `assets/images/filename.png`
   - Images automatically fallback to a default if the specified image is missing

5. **Profile not showing after login?**
   - Use `test-profile.html` to simulate a logged-in user
   - Make sure user data is stored with name, email, and phone fields
   - Check browser console for JavaScript errors

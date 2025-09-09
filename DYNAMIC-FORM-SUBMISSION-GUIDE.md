# Dynamic Form Submission Guide

## Overview
The FormSubmissions component has been completely updated to work dynamically with any changes made in the FormBuilder. It now supports all field types and advanced features like conditional fields.

## Features Supported

### Field Types
- **Text**: Simple text input
- **Textarea**: Multi-line text input  
- **Number**: Numeric input with validation
- **Email**: Email input with validation
- **Date**: Date picker
- **File**: File upload (stores filename)
- **Select**: Dropdown with options
- **Radio**: Single selection from options
- **Checkbox**: Multiple selection from options

### Advanced Features
- **Conditional Fields**: Fields that appear based on dropdown selections
- **Dynamic Options**: Options are parsed from comma-separated strings
- **Validation**: Required field validation for both main and conditional fields
- **Visual Indicators**: Badges show field types and requirements

## How It Works

### Data Structure
- **Form Items**: Loaded from the database with `sort_order` for proper sequencing
- **Options**: Stored as comma-separated strings in the `options` field
- **Conditional Fields**: Stored as JSON in the `conditional_fields` field

### Conditional Fields Logic
1. When a dropdown value is selected, the system:
   - Parses the `conditional_fields` JSON
   - Shows/hides relevant conditional fields
   - Manages validation for visible conditional fields
   - Stores responses with unique keys

### Response Handling
- Main field responses: `{itemUuid: {value, valueType, form_item_uuid}}`
- Conditional field responses: `{parentUuid_selectedValue_fieldId: {value, valueType, form_item_uuid}}`

## Usage

### For Users
1. Select a form from the dropdown (if multiple forms exist)
2. Fill out the main form fields
3. When you select dropdown options, additional fields may appear
4. Fill out any required conditional fields
5. Submit the form

### For Developers
The component automatically adapts to:
- New field types added in FormBuilder
- Changes to options in existing fields
- Addition/removal of conditional fields
- Changes to validation rules

## Visual Indicators
- **Required fields**: Red asterisk (*)
- **Field type**: Blue badge showing the input type
- **Required badge**: Yellow badge for required fields
- **Conditional fields**: Blue "Has Conditional Fields" badge
- **Additional questions**: Highlighted section with icon

## Error Handling
- Field-level validation errors displayed below each field
- Form-level validation prevents submission with missing required fields
- Graceful handling of malformed conditional field JSON
- Console warnings for debugging issues

## Future Enhancements
- File upload with actual file storage
- More conditional field trigger types (not just dropdowns)
- Field dependencies beyond parent-child relationships
- Custom validation rules per field type

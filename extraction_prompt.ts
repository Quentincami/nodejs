export const prompt = `
Extract all texts from this presentation slide (literal extraction, do not summarize!) and tabular data, when image or diagram is present describe it.
When a graph with data is present, describe what it represents in detail, with key messages on data points.  When extracting texts, those that are part of a diagram or graph should be only extracted within this context, not within the "text" category.

Write the extracted contents in JSON format, that will follow this structure:

[
    {
        "heading": "Example slide heading",
        "text": "Example text on the slide"
        "images": [
            "Example image or diagram description",
            "Example image or diagram description",
            "Example image or diagram description"
        ],
        "graphs": [
            "Example graph description"
        ]
    }
]

If there is any part missing (like there is no heading on the slide) - just represent it as null.
Output the JSON file. Make sure your response is a VALID JSON! Do not put backticks around the output.

SYNTACTICALLY CORRECT EXAMPLE RESPONSE:
[
    {
        "slide_heading": "Ecological Threat Report 2023",
        "subheading": null,
        "text": "Key Findings\nCountry Hotspots\nEcological Threats\nMegacities\nPolicy Recommendations",
        "images": [
            "Example image"
        ],
        "graphs": []
    }
]
`
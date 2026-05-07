# JobTracker

**Save job posts. Export to NotebookLM. Analyze your job fit.**

JobTracker is a Chrome extension for job seekers who want to collect job postings, organize them by career direction, and export them to NotebookLM for AI-powered job analysis.

Instead of copying job descriptions into notes manually, JobTracker lets you save job details from recruiting pages, group them into batches, and export everything as Markdown or CSV for deeper analysis.

[中文说明](./README_zh-CN.md)

---

## Why JobTracker?

Job searching often becomes messy:

- You open dozens of job posts.
- You forget which roles looked promising.
- You cannot easily compare requirements across companies.
- You do not know which skills appear most often.
- You want AI to help, but the job data is scattered everywhere.

JobTracker helps you turn job posts into a structured job research database.

A typical workflow:

1. Create a batch, such as `AI Product Manager`, `Data Analyst`, or `Frontend Engineer`.
2. Save 10–30 job posts from recruiting websites.
3. Export the batch as Markdown.
4. Upload it to NotebookLM.
5. Ask NotebookLM to summarize common requirements, skill gaps, company patterns, and resume improvement ideas.

---

## Demo

![JobTracker Screenshot](./src/screenshot.png)

---

## Features

- Save job information from the current recruiting detail page.
- Extract job title, company, location, salary, responsibilities, and requirements when available.
- Organize saved jobs into different batches.
- Rename and delete batches.
- View saved jobs in a collapsible list.
- Delete a single job or clear the current batch.
- Store data locally in Chrome `storage.local`.
- No account required.
- No server required.
- No external API required.
- Export the current batch as Markdown.
- Export jobs individually or as one combined Markdown file.
- Export the current batch as CSV for spreadsheet analysis.
- Open NotebookLM and use exported job data as a source for AI analysis.

---

## Recommended Workflow

### 1. Create a batch

Create one batch for each career direction.

Examples:

- `AI Product Manager`
- `Data Analyst`
- `UX Researcher`
- `Frontend Engineer`
- `Marketing Manager`

### 2. Save job posts

Open a job detail page and click the JobTracker extension icon.

JobTracker will try to extract:

- Job title
- Company
- Location
- Salary
- Job responsibilities
- Job requirements

### 3. Export to NotebookLM

Export your selected batch as Markdown and upload it to NotebookLM.

Then ask questions like:

```text
Based on these job postings, summarize the top 10 most common skills required for this role.
```

```text
Compare these job descriptions and identify the differences between junior, mid-level, and senior roles.
```

```text
Based on these jobs, what should I improve in my resume?
```

```text
Create a 30-day learning plan based on the skill gaps shown in these job descriptions.
```

### 4. Use CSV for tracking

Export the batch as CSV if you want to filter, sort, or analyze jobs in a spreadsheet.

---

## NotebookLM Prompt Templates

After exporting your jobs to Markdown, you can upload the file to NotebookLM and use prompts like these:

### Job Requirement Analysis

```text
Analyze all uploaded job postings and summarize:

1. The most common hard skills.
2. The most common soft skills.
3. The most frequently mentioned tools.
4. The most common responsibilities.
5. The differences between entry-level, mid-level, and senior roles.
```

### Resume Gap Analysis

```text
Based on these job postings, identify the skills and experiences I should emphasize in my resume.

Please group your suggestions into:

1. Must-have skills.
2. Nice-to-have skills.
3. Project experience I should highlight.
4. Keywords I should include in my resume.
5. Potential weaknesses I should fix.
```

### Career Direction Analysis

```text
Based on these job postings, help me understand whether this career direction is a good fit.

Please analyze:

1. Common responsibilities.
2. Required skills.
3. Learning difficulty.
4. Career growth potential.
5. How I should prepare over the next 30 days.
```

---

## Installation

### Option 1: Install with an AI coding agent

Send this GitHub repository to your coding agent, such as Claude Code, Codex, or another agent, and ask:

```text
Install this Chrome extension.
```

Repository:

```text
https://github.com/Rambo-WuDi/JobTracker
```

### Option 2: Manual installation

#### Step 1: Download JobTracker from GitHub

1. Open the JobTracker GitHub repository:

```text
https://github.com/Rambo-WuDi/JobTracker
```

2. Click the green **Code** button.
3. Click **Download ZIP**.
4. After the ZIP file is downloaded, unzip it.
5. You should get a folder named something like `JobTracker-main`.

#### Step 2: Load JobTracker in Chrome

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Turn on **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select the unzipped `JobTracker-main` folder.
6. JobTracker should now appear in your Chrome extensions list.
7. Open a recruiting job detail page.
8. Click the JobTracker icon in the browser toolbar.
9. JobTracker will open in the Chrome side panel.

If Chrome shows an error, make sure you selected the unzipped folder that contains `manifest.json`.

---

## Privacy

JobTracker is designed to be local-first.

- Your data is stored in Chrome `storage.local`.
- No account is required.
- No server is used.
- No external API is called.
- JobTracker does not automatically log in to websites.
- JobTracker does not bypass paywalls.
- JobTracker does not scrape job listing pages in bulk.
- JobTracker only works on the page you are currently viewing.

---

## Current Limitations

- JobTracker works best on job detail pages, not job listing pages.
- Different recruiting websites use different page structures, so extraction may not always be perfect.
- The extension uses general heuristic rules to extract job information.
- NotebookLM page behavior may change over time, so automatic handoff may not always work.
- If NotebookLM automation fails, you can still copy the exported Markdown manually.
- JobTracker uses the Chrome Side Panel API. The side panel may appear on the left or right depending on your Chrome settings.

---

## Who Is This For?

JobTracker is useful for:

- Job seekers comparing many job posts.
- Students preparing for internships.
- Career switchers researching a new role.
- People using NotebookLM for career planning.
- Users who want to build their own job research database.
- Anyone who wants a more structured job search workflow.

---

## Contributing

Contributions are welcome.

Good first issues may include:

- Improving website extraction rules.
- Adding export templates.
- Improving UI text.
- Adding screenshots or demo GIFs.
- Translating the interface.
- Improving documentation.

---

## License

MIT

Created by Rambo Wu.

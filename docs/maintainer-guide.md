# Maintainer Guide

The content for didcomm.org comes from a github repo. The repo has maintainers. This document explains the rules that maintainers follow as they evaluate pull requests.

## Intent

This website's purpose is to help developers learn about DIDComm and then discover and share protocols &mdash; NOT to opine about which protocols are good or bad. Didcomm.org should play the same role for the DIDComm community that pypi.org plays for Python, npmjs.org plays for JavaScript, Maven Central plays for JVM languages, and crates.io plays for Rust. The principle guiding our maintenance is to help the site achieve this purpose. "Simple, clear purpose and principles give rise to complex and intelligent behavior. Complex rules and regulations give rise to simple and stupid behavior." (Dee Hock)

Most content on this website is about protocols. Specific instructions about how to raise good PRs for protocols can be found [here](pr-guide.md). PRs to change web site behavior or styles, to add more documentation, or to fix hyperlinks and other bugs are also possible. All merges should further the site's overall purpose.

## Checklist

Use the checklist below to stimulate thinking. Do not attempt deep curation; rather, merge ensure that content meets reasonable and lightweight quality standards, and then prefer to merge quickly.

1. *Content must be useful to professional software developers*. This probably means that PRs should contain more information than someone could find in a casual web search, should use tags and other site features intelligently, should be coherent and readable, and should not have broken hyperlinks or similar basic quality problems.
   
2. *Content must be contributed under an Apache 2 license.*
   
3. *Content must be factual, legal, clean, and minimally controversial.* This means we cannot accept material that infringes copyright or licenses, that is a political lightning rod, that is branded or styled out of harmony with the rest of the site, or that constitutes self-serving advertisement.
   
    >A note about controversy: the "lightning rod" and "minimally controversial" criteria are about *descriptive content*, not protocol specs. Assuming a protocol is broadly legal and has legitimate uses, we are willing to register it, even if its usefulness, its virtues, or its agenda are controversial. What we cannot merge is inflammatory or divisive rhetoric.
 
3. *Content must be properly attributed.* Quotes, facts, and "see also" references need to be properly linked.

## Making Decisions
   
1. Trivial updates (e.g., to fix a typo) can be merged immediately by any maintainer, including the maintainer who submits the PR.
   
2. Merge decisions about meaningful content or about website changes can be made by an single maintainer other than the submitter. A maintainer may ask questions or request changes or comments first, at their discretion.
   
3. Difficult merge decisions require a consensus of all maintainers. The consensus must be announced in the comment thread of the PR, and must be followed by at least 1 week of public comment. Longer comment periods may be used, at the discretion of the maintainers.
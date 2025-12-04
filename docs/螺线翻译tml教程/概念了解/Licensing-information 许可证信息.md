## Table of Contents
* [Primer about licenses](#primer-about-licenses)
* [About copyright](#about-copyright)
* [About trademarks and patents](#about-trademarks-and-patents)
* [About tModLoader's license](#about-tmodloaders-license)
* [How to license your mod(s)](#how-to-license-your-mods)
* [Not using a license ("license free") or opting-out of copyright](#not-using-a-license-license-free-or-opting-out-of-copyright)
* [Copyright infringement](#copyright-infringement)
* [Sources](#sources)

# Primer about licenses
When you make a creative work (which includes code), the work is under exclusive copyright by default. 
Unless you include a license that specifies otherwise, nobody else can use, copy, distribute, or modify the work without being at risk of take-downs, shake-downs, or litigation. 
Once the work has other contributors (each a copyright holder), “nobody” starts including you.
Even in the absence of a license file, you may grant some rights in cases where you publish your source code to a site that requires accepting terms of service. 
For example, if you publish your source code in a public repository on GitHub (like tModLoader), you have accepted the Terms of Service, by which you allow others to view and fork your repository. ([read more](https://help.github.com/en/articles/licensing-a-repository#disclaimer))
Others may not need your permission if limitations and exceptions to copyright apply to their particular situation. 
Neither site terms nor jurisdiction-specific copyright limitations are sufficient for the kinds of collaboration that people usually seek on a public code host, such as experimentation, modification, and sharing as fostered by an open source license. A shorthand definition of license is "a promise by the licensor not to sue the licensee". That means without a license any use or exploitation of intellectual property by a third party would amount to copying or infringement. Such copying would be improper and could, by using the legal system, be stopped if the intellectual property owner wants to do so


# About copyright
Copyright is a legal right, existing in many countries, that grants the creator of an original work exclusive rights to determine whether, and under what conditions, this original work may be used by others.
This is usually only for a limited time. 
The exclusive rights are not absolute but limited by limitations and exceptions to copyright law, including fair use. 
A major limitation on copyright on ideas is that copyright protects only the original expression of ideas, and not the underlying ideas themselves.

# About trademarks and patents
Copyright **is not** the same as a patent or trademark.
Copyright protects original works of authorship created by you. 
A patent protects inventions and useful discoveries. 
Trademark protects distinctive words, phrases, symbols, sounds and designs.
Trademarks identify and distinguish the source of the goods (and services) of one party from those of another party.

# About tModLoader's license
TML uses the [MIT License](https://raw.githubusercontent.com/tModLoader/tModLoader/stable/LICENSE), also known as the Expat license.
The MIT License is a very permissive license, and it was actually meant to be read by ordinary people and not just lawyers and attorneys.

According to ["Understanding Open Source and Free Software Licensing" by By Andrew M. St. Laurent](http://oreilly.com/openbook/osfreesoft/book/):
> These licenses, as applied to the original licensed code, allow that code to be used in proprietary software and do not require that open source versions of the code be dis- tributed. Code created under these licenses, or derived from such code, may go “closed” and developments can be made under that proprietary license, which are lost to the open source community. For the same reason, however, these licenses are very flexible and compatible with almost every form of open source license.

To explain this more thoroughly, it means you can distribute the compiled software without the MIT license, and that you can distribute your own source code that uses the MIT-licensed software, but your own source code does not have to be licensed under the MIT license. The MIT license only protects the code it was licensed for. This means if you make a fork of TML, you are free to choose another license to distribute your work under, but you must still include the MIT license because that's what TML was licensed under.

The license also provides a disclaimer. Essentially, we (the publishers of TML) are not responsible for damage done to you or your computer by using the software.

# How to license your mod(s)
To license your own mod isn't very difficult. If you take things very seriously, you can consult a professional and setup your own license. It is however recommended, to take a good look at existing licenses that cover the points that you want. You can use a website such as [https://choosealicense.com](https://choosealicense.com) to help you find and choose one. The most common licenses are the MIT License, Apache License, and GNU License (but there are many more licenses).

Including a license on Github (and many other distribution platforms) is easy. On Github, people will usually include a file called "LICENSE" or "LICENSE.txt" in the root of their project. Github will also attempt to automatically detect your license by checking for this file. Simply include the contents of the license you want in such file, and your repository site now includes that license.

**Please note** that you cannot stop others from viewing (unless you make your project private) or forking your repository. If you publish your source code in a public repository on GitHub, according to the [Terms of Service](https://help.github.com/en/articles/github-terms-of-service), other GitHub users have the right to view and fork your repository within the GitHub site. If you have already created a public repository and no longer want users to have access to it, you can make your repository private. When you convert a public repository to a private repository, existing forks or local copies created by other users will still exist. For more information, see ["Making a public repository private."](https://help.github.com/en/articles/making-a-public-repository-private) (see also: [Licensing a repository](https://help.github.com/en/articles/licensing-a-repository))

## Selective Licensing
Depending on the nature of the project in question, licensing parts of it piece-wise may be required. 

Consider the [Calamity Mod Music](https://github.com/CalamityTeam/CalamityModMusicPublic). It contains a large quantity of copyrighted assets and some code to load them.
Given the significant value associated with maintaining copyright ownership and control over assets, they utilize a uniform all-rights reserved copyright.
In contrast, [Example Mod](https://github.com/tModLoader/tModLoader/tree/1.4.4/ExampleMod) contains a large quantity of code samples intended for usage by others. It uses a uniform MIT license, and all assets included have also been licensed as MIT for usage under those conditions.

You may select multiple licenses. You are required to ensure that you explicitly identify what is covered under what license. 

As such, if you are considering making your mod source code visible then it is recommended to consider if you wish to apply a separate licenses for your code and assets. If you do, please consult appropriate image/music licensing authority and explicitly identify the scope of files under each license. 
Usually, it will look something like 'All files are all rights reserved, with the exemption of the C# Source File type which is licensed under {your license here}'. It is recommended to consult examples such as [LibreOffice](https://www.libreoffice.org/about-us/source-code/) or [Mozilla's Firefox](https://www.mozilla.org/en-US/foundation/licensing/)   

# Not using a license ("license free") or opting-out of copyright
You are not under obligation to use a license. As stated before, the default copyright laws apply, so you retain all rights to the work of your project and no one may reproduce, distribute, or create derivative works from your work. (Except for viewing and forking your project on the Github website, as stated by the ToS, that is only if you use Github. Please consult the Terms of Service of the distribution platform you use to inform yourself). Not using a license is called software that is "license free". License-free software is computer software that is not explicitly in the public domain, but the software owner has not made explicit the terms of the license which makes the software fully copyright protected according to the Berne convention. (see also: [wikipedia](https://en.wikipedia.org/wiki/License-free_software))

If you do not care much, not using a license is fine, but it is advised to make an informed decision for choosing a license.

The "Unlicense" is another such option if you want to [disclaim copyright monopoly interest](https://cr.yp.to/publicdomain.html). You can do so easily by licensing your work under [the "Unlicense"](https://unlicense.org/).
**But please note** that the Unlicense isn't exactly very 'detailed', it's rather simplistic and open to different kinds of interpretations which can lead to liability concerns in legal context. It can be considered as written 'easy to read for humans', but not necessarily fit for legal systems we use today. You may be more interested in the [Creative Commons Zero License](https://creativecommons.org/share-your-work/public-domain/cc0/) (CC0) if you want to dedicate your work to the public domain, it is much better defined license. Please note also the Creative Commons (CC0) licenses are very popular, very well established and used for many products and not just code. All of the CC licenses are a good choice.
**The Unilicense is NOT global.** The Unilicense doesn't make sense outside of a commonwealth ecosystem, **has unclear legality in some countries (Australia, New Zealand, etc.) and is even explicitly illegal in some countries (like Germany)**. Lastly, some clauses can easily be interpreted for another or vague meaning, so if you somehow go to court, it may take a few trials for a legal team to come up with an objective definition for the Unilicense. 

**Please understand** that it is _not_ possible to completely relinquish yourself of copyright holding in every jurisdiction, but certain licenses like the CC0 license are the most complete alternatives to still serve your product to a public domain. We highly recommend any of the CC0 licenses if this is your goal.

# Copyright infringement
Someone may have infringed your copyright, and may be held liable for not abiding to the terms of your license. There is only so much we can do as a non-professional, hobbyist modding team. 

We own the in-house Mod Browser. What we can offer you is a takedown of the copied mod in question if you can provide proof, but we have no jurisdiction on other platforms such as Github and limited jurisdiction on partner platforms like Steam. 

We also cannot offer you legal advise. If it is of importance, you are advised to consult a professional. If you want to contact us, your best bet is by contacting the tmodloader dev team through our [discord server](https://discord.gg/tmodloader) (this will require a DiscordApp account)

# Sources
All sources were consulted on the 26th of April, 2019 unless stated otherwise
* https://en.wikipedia.org/wiki/License-free_software
* https://choosealicense.com/no-permission/
* https://en.wikipedia.org/wiki/Copyright
* https://unlicense.org/
* https://help.github.com/en/articles/licensing-a-repository
* https://help.github.com/en/articles/github-terms-of-service
* https://choosealicense.com
* https://www.gnu.org/licenses/agpl.html
* https://creativecommons.org/share-your-work/public-domain/cc0/
* https://github.com/Dradonhunter11/tModLoader/tree/x64
* https://web.archive.org/web/20170301020915/https://lists.opensource.org/pipermail/license-review/2012-January/001386.html (consulted 29 July 2019)
---
title: Statistical Errors (With Aliens)
layout: default
nav_exclude: true
date: "2021-01-05"
short_desc: "Sometimes you just need a push to get started. Here’s what worked for me."
thumbnail: "/assets/images/aliens/ufo-alien.jpg"
category: "post"
---
January 25, 2021
# Statistical Errors (With Aliens)

This post is for the ones who are curious about data science but fairly new to stats and hypothesis testing. It is inspired by an answer I gave during an interview question last year.
Hey, by the way, this is a simplified post. I hope you will be able to grasp concepts like the Null Hypothesis, Type I and Type II errors in less than 5 minutes to prevent the aliens from fooling you in the future! Stay tuned for more content covering basic and advanced technical topics. 
Let’s go:
Imagine that two aliens, Blorb and Zurp, are visiting Earth during an expedition to study our galaxy cluster. They arrive at the peak of the 2020 pandemic having no idea how humans look like. They first arrived in the US and ended up landing at an NBA match where no fans were allowed. They looked at the 10 players in the court and measured their average height: 200cm. 
Blorb states: “Wow, Zurp. Humans are really tall. Their average height is 200cm just like in all other planets in this cluster of galaxies!”. Blorb rushed to publish the findings in the “Journal of Interplanetary Nature” but, despite all the media coverage in their planet, Zurp was a bit uncomfortable assuming all humans are that tall and decided to test an alternative to Blorb’s assertion (which is based in their current expedition into the galaxy cluster started a month ago).
Zurp organised the test like this:
H0, the null hypothesis: Humans’ average height is 200cm
H1, alternative hypothesis: Humans’ average height is not 200cm
Where “null hypothesis”, in simple terms, can be interpreted as “the default state” or whatever is assumed to be true unless proven otherwise with robust statistical evidence.
The interplanetary alliance awaits for the results while Blorb and Zurp collect more data by visiting all NBA matches occurring in that week to take further measurements (they were not interested in basketball anyway) but in the end the average didn’t vary significantly from 200cm (we will discuss confidence intervals, p-values, critical region etc in another post). Zurp concludes: “Indeed, we cannot falsify your claim, Blorb”. The findings are published in the “Periodic of Interplanetary Knowledge”. Oh my… they just made a Type II error because they failed to reject a false null hypothesis. 
Clearly, asserting humans’ average height based solely on NBA players is not a good approach but Zurp and Blorb are not very smart.
Forget about this experiment now. Let’s travel back to an alternative past and see Blorb and Zurp in a different scenario.
Blorb and Zurp look at the 10 NBA players. They observe players are 200cm tall on average. However, Blorb now states: “Zurp, these humans are too tall. This may not be a common thing here on Earth. I believe humans’ average height is the same as the one for all planets in the universe: 170cm”. Blorb published that in the not-reputable “Planetary Curiosities Magazine” but Zurp decided to investigate further with the following hypothesis:
H0, the null hypothesis: Humans’ average height is 170cm
H1, alternative hypothesis: Human’s average height is not 170cm
Once again they visit all NBA matches occurring on that week to collect more data and, again, 200cm is the average they found. And yet another error: now they fell into Type I error because they rejected a true null hypothesis. 
They should've spent more time thinking about their test overall. Leave a comment below with your idea on what they could've done differently.
There’s also a 3rd type of error called Type III (who’d tell.…). It happens when you correctly reject a null hypothesis but you do so based on the wrong evidences and reasons. This may be the case when  a hypothesis is ill-defined or completely wrong!
Next is the Type IV error, which can be seen as a “specialisation” of Type III and happens when you correctly reject a null hypothesis but you don’t quite understand the results and make bad interpretations based on the data (for example, assuming that something that is true for humans overall must also be true for Nederlanders).
Type III and IV do not get much attention in introductory courses so, in a nutshell, we should remember the basics: 
Type I Error:  rejects a true null hypothesis (false positive)
Type II Error: fails to reject a false null hypothesis (false negative)
Out of curiosity, here’s a pretty cool Kaggle Kernel (notebook) about NBA heights if you’re into Python and data visualisations: https://www.kaggle.com/justinas/nba-height-and-weight-analysis 
That’s all, Juvenal.



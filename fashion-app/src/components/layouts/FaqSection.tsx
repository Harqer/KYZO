import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FaqItem } from '../features/FaqItem';
import { Heading } from '../elements/Heading';

interface Faq {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title?: string;
  faqs?: Faq[];
}

const defaultFaqs: Faq[] = [
  {
    question: 'How does KYZO AI work?',
    answer: 'KYZO uses advanced AI to analyze your style preferences and recommend fashion items that match your unique taste. Simply create an account and start discovering personalized recommendations.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade encryption and never share your personal information with third parties. Your privacy is our priority.',
  },
  {
    question: 'How do I get the mobile app?',
    answer: 'KYZO is available on the App Store and Google Play. Download it now for the best AI fashion experience on your mobile device.',
  },
];

export function FaqSection({ title = 'Frequently Asked Questions', faqs = defaultFaqs }: FaqSectionProps) {
  return (
    <View style={styles.container}>
      <Heading level={2} align="center">{title}</Heading>
      <View style={styles.list}>
        {faqs.map((faq, index) => (
          <FaqItem
            key={index}
            question={faq.question}
            answer={faq.answer}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  list: {
    marginTop: 24,
  },
});

import { useState } from 'react';
import { ClassConfig } from './TeacherClassSelector';
import { BookOpen, FileText, Video, Image, List, Lightbulb } from 'lucide-react';

interface ContentCreationProps {
  classConfig: ClassConfig;
  onBack: () => void;
}

export function ContentCreation({ classConfig, onBack }: ContentCreationProps) {
  const [selectedContentType, setSelectedContentType] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const contentTypes = [
    { id: 'lesson-plan', icon: List, label: 'Lesson Plan', description: 'Complete lesson structure' },
    { id: 'explanation', icon: BookOpen, label: 'Topic Explanation', description: 'Detailed explanations' },
    { id: 'examples', icon: Lightbulb, label: 'Examples & Demos', description: 'Real-world examples' },
    { id: 'slides', icon: FileText, label: 'Presentation Slides', description: 'Slide content outline' },
    { id: 'video-script', icon: Video, label: 'Video Script', description: 'Educational video script' },
    { id: 'infographic', icon: Image, label: 'Infographic Content', description: 'Visual content ideas' },
  ];

  const handleGenerate = () => {
    const finalTopics = selectedTopics.length > 0 ? selectedTopics : (topic ? [topic] : []);
    if (finalTopics.length === 0 || !selectedContentType) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const contentType = contentTypes.find(ct => ct.id === selectedContentType);
      
      let content = '';
      
      // Generate content for multiple topics
      finalTopics.forEach((finalTopic, topicIndex) => {
        if (topicIndex > 0) {
          content += '\n\n---\n\n'; // Separator between topics
        }
        
        if (selectedContentType === 'lesson-plan') {
          content = `# Lesson Plan: ${finalTopic}\n\n**Subject:** ${classConfig.subject}\n**Class:** ${classConfig.class}${classConfig.section ? ` - Section ${classConfig.section}` : ''}\n**Duration:** 45 minutes\n\n## Learning Objectives\n1. Understand the fundamental concepts of ${finalTopic}\n2. Apply knowledge through practical examples\n3. Develop critical thinking skills\n\n## Materials Needed\n- Textbook\n- Whiteboard and markers\n- Practice worksheets\n- Digital presentation\n\n## Lesson Structure\n\n### Introduction (5 minutes)\n- Warm-up activity to engage students\n- Review previous lesson concepts\n- Introduce today's topic\n\n### Main Teaching (25 minutes)\n- Explain key concepts with examples\n- Interactive discussion\n- Demonstrate practical applications\n\n### Practice Activity (10 minutes)\n- Group work or individual exercises\n- Problem-solving tasks\n\n### Conclusion (5 minutes)\n- Recap main points\n- Q&A session\n- Assign homework\n\n## Assessment\n- Formative: Class participation and questions\n- Summative: Exit ticket or quick quiz\n\n## Homework\nPractice problems on ${finalTopic} from textbook pages XX-XX`;
        } else if (selectedContentType === 'explanation') {
          content += `# ${finalTopic} - Detailed Explanation\n\n## Introduction\n${finalTopic} is a fundamental concept in ${classConfig.subject} that helps us understand [core principle]. This topic is essential for ${classConfig.class} students as it forms the foundation for more advanced concepts.\n\n## Key Concepts\n\n### Concept 1: [Main Idea]\nExplanation of the first key concept with clear, grade-appropriate language.\n\n### Concept 2: [Supporting Theory]\nDetailed breakdown of supporting theories and principles.\n\n### Concept 3: [Applications]\nReal-world applications and why this matters.\n\n## Step-by-Step Breakdown\n\n1. **First Step:** Begin with the basics\n2. **Second Step:** Build upon foundational knowledge\n3. **Third Step:** Apply to practical scenarios\n\n## Common Misconceptions\n- Misconception 1 and its correction\n- Misconception 2 and its correction\n\n## Practice Questions\n1. Define [key term]\n2. Explain the relationship between [concept A] and [concept B]\n3. Solve: [practice problem]\n\n## Summary\nKey takeaways students should remember about ${finalTopic}.`;
        } else if (selectedContentType === 'examples') {
          content += `# Examples & Demonstrations for ${finalTopic}\n\n## Real-World Examples\n\n### Example 1: Daily Life Application\n**Scenario:** [Relatable situation]\n**Explanation:** How ${finalTopic} applies in this scenario\n**Learning Point:** Key concept demonstrated\n\n### Example 2: Industry Application\n**Field:** Science/Technology/Business\n**Application:** Professional use case\n**Impact:** Real-world significance\n\n### Example 3: Historical Context\n**Event/Discovery:** Relevant historical example\n**Connection:** How it relates to ${finalTopic}\n\n## Interactive Demonstrations\n\n### Demo 1: Hands-On Activity\n**Materials:** List of materials needed\n**Procedure:**\n1. Step-by-step instructions\n2. Safety considerations\n3. Expected outcomes\n\n### Demo 2: Visual Representation\n**Setup:** How to present this visually\n**Key Points:** What to highlight\n**Student Engagement:** Questions to ask\n\n## Problem-Solving Examples\n\n**Problem 1:**\nStatement of problem\n**Solution:**\nStep-by-step solution with explanation\n\n**Problem 2:**\nMore complex scenario\n**Solution:**\nDetailed walkthrough`;
        } else if (selectedContentType === 'slides') {
          content += `# Presentation Slides Outline: ${finalTopic}\n\n**Slide 1: Title Slide**\n- ${finalTopic}\n- ${classConfig.subject} - ${classConfig.class}\n- Teacher Name & Date\n\n**Slide 2: Lesson Objectives**\n- What students will learn\n- Why it's important\n- How it connects to previous lessons\n\n**Slide 3: Introduction**\n- Hook/Engaging question\n- Brief overview\n- Real-world relevance\n\n**Slide 4-6: Main Content**\n- Key Concept 1 with visuals\n- Key Concept 2 with examples\n- Key Concept 3 with diagrams\n\n**Slide 7: Interactive Element**\n- Quiz question\n- Think-Pair-Share activity\n- Quick poll\n\n**Slide 8: Examples**\n- Practical applications\n- Worked examples\n- Case studies\n\n**Slide 9: Practice**\n- Try it yourself problems\n- Group activity instructions\n\n**Slide 10: Summary**\n- Key takeaways\n- Review main points\n- Q&A\n\n**Slide 11: Next Steps**\n- Homework assignment\n- Preview of next lesson\n- Additional resources`;
        } else if (selectedContentType === 'video-script') {
          content += `# Video Script: ${finalTopic}\n\n**Duration:** 8-10 minutes\n**Target Audience:** ${classConfig.class} students\n**Subject:** ${classConfig.subject}\n\n## Introduction (0:00 - 1:00)\n[On screen: Engaging title animation]\n\n**Narration:**\n"Hello students! Today we're going to explore ${finalTopic}. Have you ever wondered [engaging question]? By the end of this video, you'll understand [learning objectives]."\n\n[Visual: Show relevant images/graphics]\n\n## Main Content\n\n### Section 1 (1:00 - 3:00)\n**Narration:**\n"Let's start with the basics. ${finalTopic} is [definition]..."\n\n[Visual: Animated diagrams showing concept]\n\n**Key Points to Cover:**\n- Point 1 with visual aid\n- Point 2 with example\n- Point 3 with demonstration\n\n### Section 2 (3:00 - 5:00)\n**Narration:**\n"Now that we understand the basics, let's see how this works in practice..."\n\n[Visual: Real-world examples, screen recordings]\n\n### Section 3 (5:00 - 8:00)\n**Narration:**\n"Let's work through an example together..."\n\n[Visual: Step-by-step problem solving]\n\n## Conclusion (8:00 - 9:00)\n**Narration:**\n"Great job! Today we learned about ${finalTopic}. Remember the key points: [summary]"\n\n[Visual: Summary graphics]\n\n**Call to Action:**\n"Try the practice problems in the description. See you in the next lesson!"\n\n## Production Notes\n- Use animations for complex concepts\n- Include captions for accessibility\n- Add background music (subtle, non-distracting)\n- Include practice quiz in video description`;
        } else {
          content += `# Infographic Content: ${finalTopic}\n\n## Visual Layout Suggestions\n\n### Header Section\n- Bold title: "${finalTopic}"\n- Subtitle: "${classConfig.subject} - ${classConfig.class}"\n- Eye-catching icon or illustration\n\n### Main Content Sections\n\n**Section 1: Key Facts**\n📊 Statistic 1: [Relevant data]\n📈 Statistic 2: [Important number]\n💡 Fun Fact: [Interesting tidbit]\n\n**Section 2: Process/Timeline**\n1️⃣ First Step → Visual representation\n2️⃣ Second Step → Icon/diagram\n3️⃣ Third Step → Illustration\n\n**Section 3: Comparison**\n[Create visual comparison chart]\n- Before/After\n- Pros/Cons\n- Different approaches\n\n**Section 4: Applications**\n🏠 At Home: [Example]\n🏫 At School: [Example]\n🌍 In Nature: [Example]\n\n### Footer Section\n- Key takeaway message\n- QR code for more resources\n- Credits/sources\n\n## Design Recommendations\n- Color scheme: [Suggest 3-4 colors]\n- Icons: Modern, simple line art\n- Typography: Clear, readable fonts\n- Layout: Vertical scroll or poster format\n- Size: Optimized for digital sharing and printing`;
        }
      });
      
      setGeneratedContent(content);
      setIsGenerating(false);
    }, 2000);
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl mb-1 dark:text-white">Content Creation</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {classConfig.class} • {classConfig.subject}
            {classConfig.section && ` • Section ${classConfig.section}`}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Panel - Configuration */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="mb-3 dark:text-white">Content Type</h3>
              <div className="space-y-2">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedContentType(type.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all text-sm ${
                      selectedContentType === type.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <type.icon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="mb-3 dark:text-white">Topics</h3>
              
              {classConfig.topics && classConfig.topics.length > 0 && selectedContentType && (
                <div className="mb-3">
                  <label className="block text-xs mb-2 dark:text-gray-300">
                    Select Topics {selectedTopics.length > 0 && `(${selectedTopics.length} selected)`}
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    {classConfig.topics.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleTopic(t)}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-all ${
                          selectedTopics.includes(t)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Or enter custom topic below</p>
                </div>
              )}
              
              <div>
                <label className="block text-xs mb-2 dark:text-gray-300">Custom Topic (optional)</label>
                <textarea
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setSelectedTopics([]);
                  }}
                  placeholder="Enter custom topic..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={selectedTopics.length > 0}
                />
                {selectedTopics.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Clear topic selections to use custom topic
                  </p>
                )}
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={(!topic && selectedTopics.length === 0) || !selectedContentType || isGenerating}
                className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
              >
                {isGenerating ? 'Generating...' : `Generate for ${selectedTopics.length > 0 ? `${selectedTopics.length} Topic${selectedTopics.length > 1 ? 's' : ''}` : 'Topic'}`}
              </button>
            </div>
          </div>

          {/* Right Panel - Generated Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md min-h-[500px] border border-gray-100 dark:border-gray-700">
              {!generatedContent ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Select type and topic to generate</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg dark:text-white">Generated Content</h2>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedContent)}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg dark:text-gray-200 max-h-[600px] overflow-y-auto">
                    {generatedContent}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}